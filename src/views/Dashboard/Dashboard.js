import React, { Component } from "react";
import mysql from 'mysql';
import env from '../../../.env'
import { 
  Container, 
  Row, 
  Col, 
  Table, 
  Button, 
  ProgressBar,
  ButtonGroup,
  Modal
} from "react-bootstrap";
import { Card } from "../../components/Card/Card";
import { BootstrapTable, TableHeaderColumn}  from 'react-bootstrap-table'
const { ipcRenderer } = window.require('electron')

class Dashboard extends Component {
constructor(props) {
  super(props);
  this.state = {
    inventario_id: localStorage.getItem('inv_id') || '',
    inventario_status: localStorage.getItem('inv_status') || '',
    tipo_coleta: 'INVENTARIO',
    inventario: [],
    base: [],
    coleta: [],
    enderecamento: [],
    enderecamentoCod: [],
    equipe: [],
    isPaused: true,
    horas: 0, minutos: 0, segundos: 0,
    isEnable: false, 
    timeFormat: '00:00:00',
    items: [], text: '',
    showModalCod: false,
    progressTotal: 0
  };

  this.playClock = this.playClock.bind(this);
  this.pauseClock = this.pauseClock.bind(this);
  this.stopClock = this.stopClock.bind(this);    
  this.handleShow = this.handleShow.bind(this);
  this.handleClose = this.handleClose.bind(this);
}
tick() {
  let s = this.state.segundos + 1; 
  let min = this.state.minutos;
  let h = this.state.horas; 
  if (s === 60){
    min = min + 1;
    s = 0;
  }
  if (min === 60){
    h = h + 1;
    min = 0;
  }
  this.setState({
    horas: h, minutos: min, segundos: s
  });
  let timeFormat = this.timeFormater(this.state.horas) + ':' +this.timeFormater(this.state.minutos) +':'+this.timeFormater(this.state.segundos);
  this.setState({timeFormat});
  
}
startClock(){
  this.interval = setInterval(
    () => {
      if(!this.state.isPaused){
        this.tick()
        this.lerColeta()
        this.lerEquipe()
        this.lerEnd()
      }
    }, 1000
  ); 
}
playClock(){
  const {tipo_coleta} = this.state
  ipcRenderer.send('asynchronous-message', {controle:'play', tipo_coleta:tipo_coleta})
  this.setState({"isPaused": false, "isEnable": true});

}
stopClock(){
  alert('Gerar divergencia.');
  this.pauseClock();
  this.setState({
    horas: 0, minutos: 0, segundos: 0, "isEnable": false,
    timeFormat: '00:00:00',
  });
  // this.inserirDivergencia()
  // this.props.history.push('/admin/divergencia')
  this.props.history.push('/admin/codigo')
}
pauseClock(){
  const {tipo_coleta} = this.state
  ipcRenderer.send('asynchronous-message', {controle:'pause', tipo_coleta})
  this.setState({"isPaused": true, "isEnable": false});
}
timeFormater(time) {
  if (time < 10) {
      time = '0' + time
  }
  return time
}
componentDidMount() {
  this.startClock();
  this.lerBase();
  this.lerColeta();
  this.lerEnd();
  this.lerEquipe();
}
componentWillUnmount() {
  clearInterval(this.interval);
}
lerBase(){
  const base = ipcRenderer.sendSync('getBase', 'base')
  this.setState({base})
}
lerColeta(){
    const coleta = ipcRenderer.sendSync('getColeta', 'coleta')
    let results = []
    new Promise((resolve, reject)=>{
      coleta.forEach(col => {
        if (!results.find( elem => {
          if(elem.cod_barra === col.cod_barra && elem.enderecamento === col.enderecamento){
            elem.qtd_inventario += col.itens_embalagem
            return true;
          }
          return false;
        })){
          results.push({
            'cod_barra' : col.cod_barra, 
            'enderecamento': col.enderecamento,
            'qtd':col.itens_embalagem,
            'id': col.cod_barra+col.enderecamento
          });
        }
      })
      resolve()
    }).then(()=>{
      this.setState({coleta: results})
    })
}
lerEnd() {
  Promise.resolve(
    ipcRenderer.sendSync('getEnd', this.state.inventario_id)
  ).then((enderecamento)=>{
    this.setState({enderecamento})
  })
}
lerEquipe() {
  Promise.resolve(
    ipcRenderer.sendSync('getEquipe', this.state.inventario_id)
  ).then( equipe => {
    let qtd_enderecamentoTotal = 0
    let qtd_concluidoTotal = 0
    
    const eq = equipe.map(i => {
      i['progress'] = Number(((i['qtd_concluido'] / i['qtd_enderecamento'])*100).toFixed(1))
      qtd_enderecamentoTotal += i.qtd_enderecamento
      qtd_concluidoTotal += i.qtd_concluido
      return i
    })

    const progressTotal = Number(((qtd_concluidoTotal / qtd_enderecamentoTotal)*100).toFixed(1))
    return { equipe: eq, progressTotal }
  }).then(({ equipe, progressTotal }) => {
    console.log('Edu:', { equipe, progressTotal })
    this.setState({ equipe, progressTotal })
  })
}
inserirDivergencia() {
  let {inventario_id, tipo_coleta} = this.state;
  if (inventario_id) {
    let connection = mysql.createConnection(env.config_mysql);

    let query = `delete from divergencia where inventario_id=?`
    connection.query(query , [inventario_id], (error, results, fields) => {
      if(error){
          console.log(error.code,error.fatal)
          return
      }
      query = `
        INSERT INTO divergencia (
          auditar,
          inventario_id, base_id, enderecamento, cod_barra,
          cod_interno, descricao_item, valor_custo, valor_venda,
          saldo_estoque, qtd_inventario  
        )
        SELECT 
        CASE
        WHEN base_id IS NULL THEN 'NAO PODE'
        WHEN enderecamento IS NULL  THEN 'NAO PODE'
        ELSE 'NAO' END auditar,
          
          
          
          inventario_id, base_id, enderecamento, cod_barra,
          cod_interno, descricao_item, valor_custo, valor_venda,
          saldo_estoque, qtd_inventario
        FROM (
              SELECT COALESCE(b.inventario_id, c.inventario_id) inventario_id, b.id base_id, enderecamento, COALESCE(b.cod_barra, c.cod_barra) cod_barra,
              b.cod_interno, b.descricao_item,
              COALESCE(b.saldo_estoque, 0) saldo_estoque, COALESCE(c.qtd_inventario, 0) qtd_inventario,
              b.valor_custo, b.valor_venda
              FROM (
              SELECT id, inventario_id, cod_barra, cod_interno, saldo_estoque, valor_custo, valor_venda, descricao_item
              FROM base 
              WHERE inventario_id = ?
              ) b
              LEFT OUTER JOIN (
              SELECT inventario_id, enderecamento, cod_barra, SUM(itens_embalagem) qtd_inventario
              FROM coleta 
              WHERE inventario_id = ? AND tipo_coleta = ?
              GROUP BY enderecamento, cod_barra
              ) c
              ON b.cod_barra = c.cod_barra
            UNION
              SELECT COALESCE(b.inventario_id, c.inventario_id) inventario_id, b.id base_id, enderecamento, COALESCE(b.cod_barra, c.cod_barra) cod_barra,
              b.cod_interno, b.descricao_item,
              COALESCE(b.saldo_estoque, 0) saldo_estoque, COALESCE(c.qtd_inventario, 0) qtd_inventario,
              b.valor_custo, b.valor_venda
              FROM (
              SELECT id, inventario_id, cod_barra, cod_interno, saldo_estoque, valor_custo, valor_venda, descricao_item 
              FROM base 
              WHERE inventario_id = ?
              ) b
              RIGHT OUTER JOIN (
              SELECT inventario_id, enderecamento, cod_barra, SUM(itens_embalagem) qtd_inventario
              FROM coleta 
              WHERE inventario_id = ? AND tipo_coleta = ?
              GROUP BY enderecamento, cod_barra
              ) c
              ON b.cod_barra = c.cod_barra
            ) A
      `
      connection.query(query , [inventario_id, inventario_id, tipo_coleta, inventario_id, inventario_id, tipo_coleta], (error, results, fields) => {
        if(error){
            console.log(error.code,error.fatal)
            return
        }
        query = `
          SELECT 1 FROM divergencia where inventario_id=? AND auditar='NAO' LIMIT 1
        `
        connection.query(query , [inventario_id], (error, results, fields) => {
          if(error){
            console.log(error.code,error.fatal)
            return
          }
          if (!results.length) {
            alert('Não há divergencias para serem auditadas!')
          } else {
            // this.props.history.push('/admin/divergencia')
            this.props.history.push('/admin/codigo')
          }
          connection.end();
        })
      })
    })
  } else {
    console.log('inventário ID vazio!')
  }
}

handleClose() {
  this.setState({ showModalCod: false });
}

handleShow(ev, end_desc) {
  Promise.resolve( 
    this.state.coleta.filter( i =>
      i.enderecamento === end_desc
    )
  ).then( enderecamentoCod =>
    this.setState({ enderecamentoCod, showModalCod: true })
  )
}

render() {
  const options = {
    defaultSortName: 'valor_divergente', 
    noDataText: 'Não há dados para exibir',
    exportCSVText: 'Exportar para csv'
  }
  const { base, coleta, timeFormat, isPaused, enderecamento, equipe, enderecamentoCod, progressTotal } = this.state
  return (
    <div className="content">
      <h1>Dashboard</h1>
      <Container fluid>
        <Row>
          <Col md={6}>
            <Card 
              title="ENDERECAMENTO"
              content={ <div style={{
                overflow: 'auto',
                height: '250px'
            }}>
              
                <ButtonGroup vertical size="sm">
                <Row className="justify-content-xs-center">{enderecamento.map(prop => {
                    return (
                      <div key={prop.id}>
                        <Col className="mb-2" xs={6} sm={4} md={4} lg = {4} xl = {3}>
                          <Button variant={(() => {
                            switch(prop.status) {
                              case 'ATIVADO':
                                return 'secondary';
                              case 'CONCLUIDO':
                                return 'success';
                              case 'INICIADO':
                                return 'warning';
                              default:
                                return 'secondary';
                            }
                          })()}
                            onClick={e => this.handleShow(e, prop.descricao)}
                            lg={3}
                            md={3}
                            sm={3} 
                            xs={3} 
                            key={prop.id}
                          >
                            {prop.descricao}
                          </Button>
                        </Col>
                      </div>
                    );
                  })}</Row>
                </ButtonGroup>
                </div>
              }
            />
          </Col>
          <Col>
            <Card
              title="ATIVIDADE"
              content={
                <div>
                  <div style={{
                    overflow: 'auto',
                    height: '187px'
                    }}>
                    {equipe.map(prop => {
                      return (
                        <div key={prop.usuario_id}>
                          <h6>{prop.nome}</h6>
                          <ProgressBar variant="success" now={prop.progress} label={`${prop.progress}%`} />
                        </div>
                      );
                    })}
                  </div>
                    <hr />
                      <h6>Total</h6>
                      <ProgressBar variant="success" now={progressTotal} label={`${progressTotal}%`} />
                </div>
              }
            />
          </Col>
          <Col>
            <Card
              content={
                <div>
                <div className="row d-flex justify-content-around mb-3"><h6>{timeFormat}</h6></div>
                <div className="row d-flex justify-content-around">  
                  <div><Button size="sm" variant="info" disabled={isPaused?false:true} onClick={this.playClock}>Play</Button></div>
                  <div><Button size="sm" variant="info" disabled={isPaused?true:false} onClick={this.pauseClock}>Pause</Button></div>
                  <div><Button size="sm" variant="info" onClick={this.stopClock}>Stop</Button></div>
                </div>
                </div>
              }
            />
          </Col>
        </Row>
        <Row>
          <Col md={6} style={{
                'marginBottom': '30px'
            }}>
          <BootstrapTable data={coleta} height='250' scrollTop={ 'Bottom' } 
            search exportCSV options={ {
    defaultSortName: 'valor_divergente', 
    noDataText: 'Não há dados para exibir',
    exportCSVText: 'Exportar para csv',
    defaultSortName: 'qtd',  // default sort column name
    defaultSortOrder: 'desc'  // default sort order
  } }>
              <TableHeaderColumn dataField='id' isKey hidden>ID</TableHeaderColumn>
              <TableHeaderColumn dataField='cod_barra' width='140' >EAN COLETA ({coleta.length})</TableHeaderColumn>
              <TableHeaderColumn dataField='enderecamento'>Enderecamento</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd' width='70'>QUANT</TableHeaderColumn>
            </BootstrapTable>
          </Col>
          <Col md={6} style={{
                'marginBottom': '30px'
            }}>
            <BootstrapTable
              
             data={base} height='250' scrollTop={ 'Bottom' } 
              search options={ options }>
              <TableHeaderColumn dataField='_id' isKey hidden>ID</TableHeaderColumn>
              <TableHeaderColumn dataField='cod_barras' width='140' >EAN BASE ({base.length})</TableHeaderColumn>
              <TableHeaderColumn dataField='descricao_item' tdStyle={{whiteSpace: 'normal'}}>DESCRIÇÃO</TableHeaderColumn>
              <TableHeaderColumn dataField='saldo_qtd_estoque' width='70'>SALDO</TableHeaderColumn>
            </BootstrapTable>
          </Col>
        </Row>
      </Container>
      <Modal show={this.state.showModalCod} onHide={this.handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Códigos Inventariados</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <BootstrapTable data={enderecamentoCod} height='350' scrollTop={ 'Bottom' } 
            search exportCSV options={ options }>
            <TableHeaderColumn dataField='cod_barra' isKey >EAN COLETA ({enderecamentoCod.length})</TableHeaderColumn>
            <TableHeaderColumn dataField='qtd' >QUANT</TableHeaderColumn>
          </BootstrapTable>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
}

export default Dashboard;
