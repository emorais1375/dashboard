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
 import Download2 from '../../components/Download2'
 import { Card } from "../../components/Card/Card";
 // import { Card } from 'react-bootstrap'
 const { ipcRenderer } = window.require('electron')

class Dashboard2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inventario_id: localStorage.getItem('inv_id') || '',
      inventario_status: localStorage.getItem('inv_status') || '',
      tipo_coleta: 'AUDITORIA2',
      inventario: [],
      base: JSON.parse(localStorage.getItem('div2')) || [],
      div1: JSON.parse(localStorage.getItem('div1')) || [],
      rl_1: JSON.parse(localStorage.getItem('rl_1')) || [],
      rl_2: JSON.parse(localStorage.getItem('rl_2')) || [],
      rl_3: JSON.parse(localStorage.getItem('rl_3')) || [],
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
      progressTotal: 0,
      showButton: false
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
    console.log('[interval] iniciado')
  }
  playClock(){
    const {tipo_coleta} = this.state
    ipcRenderer.send('asynchronous-message', {controle:'play', tipo_coleta:tipo_coleta})
    this.setState({"isPaused": false, "isEnable": true});

  }
  stopClock(){
    this.createDivergencia()
    alert('Finalizar inventario.');
    this.pauseClock();
    this.setState({
      horas: 0, minutos: 0, segundos: 0, "isEnable": false,
      timeFormat: '00:00:00',
    });
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
    console.table(this.state.rl_1)
    console.table(this.state.rl_2)
    console.table(this.state.base)
    this.startClock();
    // this.lerBase();
    this.lerColeta();
    this.lerEnd();
    this.lerEquipe();
  }
  componentWillUnmount() {
    clearInterval(this.interval);
    console.log('[interval] finalizado')
  }
  lerBase(){
    let {inventario_id} = this.state;
    if (inventario_id) {
      let connection = mysql.createConnection(env.config_mysql);
      let query = `
        SELECT cod_barra, saldo_estoque AS 'qtd' 
        FROM base 
        WHERE inventario_id=?
        GROUP BY cod_barra
      `
      connection.query(query, [inventario_id],(error, base, fields) => {
        if(error){
            console.log(error.code,error.fatal)
            return
        }
        this.setState({ base })
        connection.end();
      })
    } else {
      console.log('Vazio!')
    }
  }
  lerColeta(){
    let {inventario_id, tipo_coleta} = this.state;
    if (inventario_id) {
      let connection = mysql.createConnection(env.config_mysql);
      let query = `
        SELECT cod_barra, SUM(itens_embalagem) AS 'qtd' ,
        GROUP_CONCAT(DISTINCT enderecamento) enderecamento
        FROM coleta 
        WHERE inventario_id = ? 
        AND tipo_coleta=?
        GROUP BY cod_barra
        ORDER BY qtd DESC
      `
      connection.query(query, [inventario_id, tipo_coleta], (error, coleta, fields) => {
        if(error){
            console.log(error.code,error.fatal)
            return
        }
        this.setState({ coleta })
        connection.end();
      })
    } else {
      console.log('Vazio!')
    }
  }
  lerEnd() {
    let {inventario_id, tipo_coleta} = this.state;
    if (inventario_id) {
      let connection = mysql.createConnection(env.config_mysql);
      let query = `
        select e.id, descricao, status
        from usuario_enderecamento ue, enderecamento e 
        where ue.inventario_id=? and tipo=? 
        and enderecamento_id = e.id
      `
      connection.query(query, [inventario_id, tipo_coleta],(error, enderecamento, fields) => {
        if(error){
            console.log(error.code,error.fatal)
            return
        }
        this.setState({ enderecamento })
        connection.end();
      })
    } else {
      console.log('Vazio!')
    }  
  }
  lerEquipe() {
    let {inventario_id, tipo_coleta} = this.state;
    if (inventario_id) {
      let connection = mysql.createConnection(env.config_mysql);
      let query = `
        select usuario_id, nome, COUNT(enderecamento_id) qtd_enderecamento,
        SUM(CASE WHEN status='CONCLUIDO' THEN 1 ELSE 0 END) qtd_concluido,
        TRUNCATE(SUM(CASE WHEN status='CONCLUIDO' THEN 1 ELSE 0 END)/COUNT(enderecamento_id)*100,0) progress
        from usuario_enderecamento ue, usuario u  
        where inventario_id=? AND tipo=? AND usuario_id = u.id
        GROUP BY usuario_id
      `
      connection.query(query, [inventario_id, tipo_coleta],(error, equipe, fields) => {
        if(error){
            console.log(error.code,error.fatal)
            return
        }
        let progressTotal = 0
        equipe.map(e => {
          progressTotal = progressTotal + e.progress
        })
        progressTotal = (progressTotal/equipe.length).toFixed(1)
        this.setState({ equipe, progressTotal })
        connection.end();
      })
    } else {
      console.log('Vazio!')
    }  
  }
  createDivergencia(){
    const { base, coleta, rl_1, rl_2 } = this.state
    let divergencia2 = []
    base.map(b =>{
      let div = {
        base_id: b['base_id'],
        cod_barra: b['cod_barra'],
        saldo_estoque: b['qtd'],
        qtd_inventario: 0,
        qtd_divergencia: 0 - b['qtd'],
        // valor_divergente: Number(((0 - b['qtd'])*b['valor_custo']).toFixed(2))
      }
      let element = coleta.find(c => {
        return b['cod_barra'] === c['cod_barra']
      })
      if (element) {
        div['enderecamento'] = element['enderecamento'],
        div['qtd_inventario'] = element['qtd'],
        div['qtd_divergencia'] = element['qtd'] - b['qtd']
        // div['valor_divergente'] = Number(((element['qtd_inventario'] - b['saldo_estoque'])*b['valor_custo']).toFixed(2))
        if(div['qtd_divergencia'] !== 0) divergencia2.push(div)
      } else {
        if(div['qtd_divergencia'] !== 0) divergencia2.push(div)
      }
    })
    console.table(rl_1)
    console.table(rl_2)
    console.table(divergencia2)
    localStorage.setItem('rl_3', JSON.stringify(divergencia2))
    this.setState({rl_3: divergencia2})
    setInterval(()=>{
      this.setState({showButton: true})
    },2000)
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
              this.props.history.push('/admin/divergencia')
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
  
  handleShow(ev, key) {
    this.setState({ showModalCod: true, enderecamentoCod: [] });
    let {inventario_id, tipo_coleta} = this.state;
    if (inventario_id) {
      let connection = mysql.createConnection(env.config_mysql);
      let query = `
        SELECT cod_barra, SUM(itens_embalagem) AS 'qtd'
        FROM coleta
        WHERE inventario_id = ?
        AND tipo_coleta = ?
        AND enderecamento = ?
        GROUP BY cod_barra
        ORDER BY qtd DESC
      `
      connection.query(query, [inventario_id, tipo_coleta, key] ,(error, enderecamentoCod, fields) => {
        if(error){
            console.log(error.code,error.fatal)
            return
        }
        this.setState({ enderecamentoCod })
        connection.end();
      })
    } else {
      console.log('Vazio!')
    }
  }
  render() {
    const { showButton, base, coleta, timeFormat, isPaused, enderecamento, equipe, enderecamentoCod, progressTotal } = this.state
    return (
      <div className="content">
        {showButton && 
          <Download2 />
        }
        <h1>Dashboard</h1>
        <Container fluid>
          <Row>
          <Col md={5}>
            <Card 
              title="ENDERECAMENTO"
              content={ <div style={{
                overflow: 'auto',
                height: '250px'
            }}>
                <ButtonGroup vertical size="sm">
                  <Row className="justify-content-xs-center">{enderecamento.map(prop => {
                    return (
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
                        {/*<Button size="sm">*/}
                        {prop.descricao}
                        {/*</Button>*/}
                      </Button>
                      </Col>
                    );
                  })}</Row>
                </ButtonGroup></div>
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
          <Col md={6}>
            <Card 
              title="INVENTÁRIO"
              ctTableFullWidth
              ctTableResponsive
              content={ <div style={{
                overflow: 'auto',
                height: '200px'
            }}>
                <Table striped>
                  <thead>
                    <tr>
                      <th>EAN</th>
                      <th>QUANT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coleta.map((prop, key) => {
                      return (
                        <tr key={key}>
                          <td>{prop.cod_barra}</td>
                          <td>{prop.qtd}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table></div>
              }
            />
          </Col>
          <Col md={6}>
            <Card
              title="ESTOQUE"
              ctTableFullWidth
              ctTableResponsive
              content={<div style={{
                overflow: 'auto',
                height: '200px'
            }}>
                <Table striped >
                  <thead>
                    <tr>
                      <th>EAN</th>
                      <th>SALDO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {base.map((prop, key) => {
                      return (
                        <tr key={key}>
                          <td>{prop.cod_barra}</td>
                          <td>{prop.qtd}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table></div>
              }
            />
          </Col>
        </Row>
        </Container>
      <Modal show={this.state.showModalCod} onHide={this.handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Códigos Inventariados</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{
                overflow: 'auto',
                height: '350px'
            }}><Table striped>
            <thead>
              <tr>
                <th>EAN</th>
                <th>QUANT</th>
              </tr>
            </thead>
            <tbody>
              {enderecamentoCod.map((prop, key) => {
                return (
                  <tr key={key}>
                    <td>{prop.cod_barra}</td>
                    <td>{prop.qtd}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table></div>
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

export default Dashboard2;
