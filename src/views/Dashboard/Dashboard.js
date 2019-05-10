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
// import { Card } from 'react-bootstrap'

class Dashboard extends Component {
constructor(props) {
  super(props);
  this.state = {
    inventario_id: localStorage.getItem('inv_id') || '',
    inventario: [],
    base: [],
    coleta: [],
    enderecamento: [],
    equipe: [],
    isPaused: true,
    horas: 0, minutos: 0, segundos: 0,
    isEnable: false, 
    timeFormat: '00:00:00',
    items: [], text: '',
    showModalCod: false
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
        this.lerEnd2()
      }
    }, 1000
  ); 
  console.log('[interval] iniciado')
}
playClock(){

  this.setState({"isPaused": false, "isEnable": true});

}
stopClock(){
  alert('Gerar divergencia.');
  this.pauseClock();
  this.setState({
    horas: 0, minutos: 0, segundos: 0, "isEnable": false,
    timeFormat: '00:00:00',
  });
  this.inserirDivergencia()
  // this.props.history.push('/admin/divergencia')
}
pauseClock(){
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
  this.lerEnd2();
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
      ORDER BY qtd DESC
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
  let {inventario_id} = this.state;
  if (inventario_id) {
    let connection = mysql.createConnection(env.config_mysql);
    let query = `
      SELECT cod_barra, count(cod_barra) AS 'qtd' 
      FROM coleta 
      WHERE inventario_id = ? AND tipo_coleta='INVENTARIO'
      GROUP BY cod_barra
      ORDER BY qtd DESC
    `
    connection.query(query, [inventario_id] ,(error, coleta, fields) => {
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
  let {inventario_id} = this.state;
  if (inventario_id) {
    let connection = mysql.createConnection(env.config_mysql);
    let query = `
      SELECT id, descricao 
      FROM enderecamento 
      WHERE inventario_id=?
      ORDER BY id DESC
      -- LIMIT 40
    `
    connection.query(query, [inventario_id],(error, enderecamento, fields) => {
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
lerEnd2() {
  let {inventario_id} = this.state;
  if (inventario_id) {
    let connection = mysql.createConnection(env.config_mysql);
    let query = `
      select e.id, descricao, status
      from usuario_enderecamento ue, enderecamento e 
      where ue.inventario_id=? and tipo='INVENTARIO' 
      and enderecamento_id = e.id
    `
    connection.query(query, [inventario_id],(error, enderecamento, fields) => {
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
  let {inventario_id} = this.state;
  if (inventario_id) {
    let connection = mysql.createConnection(env.config_mysql);
    let query = `
      select usuario_id, nome, COUNT(enderecamento_id) qtd_enderecamento,
      SUM(CASE WHEN status='CONCLUIDO' THEN 1 ELSE 0 END) qtd_concluido,
      TRUNCATE(SUM(CASE WHEN status='CONCLUIDO' THEN 1 ELSE 0 END)/COUNT(enderecamento_id)*100,0) progress
      from usuario_enderecamento ue, usuario u  
      where inventario_id=? AND tipo='INVENTARIO' AND usuario_id = u.id
      GROUP BY usuario_id
    `
    connection.query(query, [inventario_id],(error, equipe, fields) => {
      if(error){
          console.log(error.code,error.fatal)
          return
      }
      this.setState({ equipe })
      console.log(equipe)
      connection.end();
    })
  } else {
    console.log('Vazio!')
  }  
}
inserirDivergencia() {
  let {inventario_id} = this.state;
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
              SELECT inventario_id, enderecamento, cod_barra, COUNT(cod_barra) qtd_inventario
              FROM coleta 
              WHERE inventario_id = ? AND tipo_coleta='INVENTARIO'
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
              SELECT inventario_id, enderecamento, cod_barra, COUNT(cod_barra) qtd_inventario
              FROM coleta 
              WHERE inventario_id = ? AND tipo_coleta='INVENTARIO'
              GROUP BY enderecamento, cod_barra
              ) c
              ON b.cod_barra = c.cod_barra
            ) A
      `
      connection.query(query , [inventario_id, inventario_id, inventario_id, inventario_id], (error, results, fields) => {
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

handleShow() {
  this.setState({ showModalCod: true });
}

render() {
  const { base, coleta, timeFormat, isPaused, enderecamento, equipe } = this.state
  return (
    <div className="content">
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
                  {enderecamento.map(prop => {
                    return (
                      <Button variant={prop.status==='ATIVADO'?'secondary':'success'}
                        onClick={this.handleShow}
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
                    );
                  })}
                </ButtonGroup></div>
              }
            />
          </Col>
          <Col>
            <Card
              title="ATIVIDADE"
              content={
                <div style={{
                overflow: 'auto',
                height: '250px'
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
              } 
            />
          </Col>
          <Col>
            <Card
              content={
                <div>
                  <h6>{timeFormat}</h6>
                  <Button size="sm" variant="info" disabled={isPaused?false:true} onClick={this.playClock}>Play</Button>
                  <Button size="sm" variant="info" disabled={isPaused?true:false} onClick={this.pauseClock}>Pause</Button>
                  <Button size="sm" variant="info" onClick={this.stopClock}>Stop</Button>
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
          <Modal.Title>Modal heading</Modal.Title>
        </Modal.Header>
        <Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={this.handleClose}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
}

export default Dashboard;
