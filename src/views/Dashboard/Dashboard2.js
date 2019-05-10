import React, { Component } from "react";
import mysql from 'mysql';
import env from '../../../.env'
import { Container, Row, Col, Table, Button } from "react-bootstrap";
import { Card } from "../../components/Card/Card";

class Dashboard2 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inventario_id: localStorage.getItem('inv_id') || '',
      inventario: [],
      base: JSON.parse(localStorage.getItem('div2')) || [],
      coleta: [],
      isPaused: true,
      horas: 0, minutos: 0, segundos: 0,
      isEnable: false, 
      timeFormat: '00:00:00',
      items: [], text: ''
    };

    this.playClock = this.playClock.bind(this);
    this.pauseClock = this.pauseClock.bind(this);
    this.stopClock = this.stopClock.bind(this);
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
        }
      }, 1000
    ); 
    console.log('[interval] iniciado')
  }
  playClock(){

    this.setState({"isPaused": false, "isEnable": true});

  }
  stopClock(){
    alert('Finalizar inventario.');
    this.pauseClock();
    this.setState({
      horas: 0, minutos: 0, segundos: 0, "isEnable": false,
      timeFormat: '00:00:00',
    });
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
    this.lerColeta();
  }
  lerBase(){
    let {inventario_id} = this.state;
    if (inventario_id) {
      let connection = mysql.createConnection(env.config_mysql);
      let query = `
        SELECT cod_barra, count(cod_barra) AS 'qtd' 
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
  componentWillUnmount() {
    clearInterval(this.interval);
    console.log('[interval] finalizado')
  }
  lerColeta(){
    let {inventario_id} = this.state;
    if (inventario_id) {
      let connection = mysql.createConnection(env.config_mysql);
      let query = `
        SELECT cod_barra, count(cod_barra) AS 'qtd' 
        FROM coleta 
        WHERE inventario_id = ? AND tipo_coleta='AUDITORIA2'
        GROUP BY cod_barra
        ORDER BY qtd DESC
      `
      connection.query(query, [inventario_id], (error, coleta, fields) => {
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
  render() {
    const { base, coleta, timeFormat, isPaused } = this.state
    return (
      <div className="content">
        <h1>Dashboard</h1>
        <Container fluid>
          <Row>
            <Col lg={4}  md={6}>
              <h6>{timeFormat}</h6>
              <Button size="sm" variant="info" disabled={isPaused?false:true} onClick={this.playClock}>Play</Button>
              <Button size="sm" variant="info" disabled={isPaused?true:false} onClick={this.pauseClock}>Pause</Button>
              <Button size="sm" variant="info" onClick={this.stopClock}>Stop</Button>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Card 
                title="Inventário"
                ctTableFullWidth
                ctTableResponsive
                content={
                  <Table striped>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Quantidade</th>
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
                  </Table>
                }
              />
            </Col>
            <Col md={6}>
              <Card
                title="Base de dados"
                ctTableFullWidth
                ctTableResponsive
                content={
                  <Table striped >
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Quantidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {base.map((prop, key) => {
                        return (
                          <tr key={prop.base_id}>
                            <td>{prop.cod_barra}</td>
                            <td>{prop.saldo_estoque}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                }
              />
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default Dashboard2;
