import React, { Component } from "react";
import mysql from 'mysql';
import env from '../../../.env'
import { Container, Row, Col, Table, Button } from "react-bootstrap";
import { Card } from "../../components/Card/Card";

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inventario_id: localStorage.getItem('inv_id') || '',
      inventario: [],
      base: [],
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
        GROUP BY cod_barra
        ORDER BY qtd DESC
      `
      connection.query(query ,(error, coleta, fields) => {
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
            cod_interno, descricao_item, valor_custo,
            saldo_estoque, qtd_inventario, qtd_divergencia,
            valor_inventario, valor_saldo_estoque, valor_divergente 
          )
          SELECT 
            CASE
            WHEN base_id IS NULL THEN 'NAO PODE'
            WHEN enderecamento IS NULL  THEN 'NAO PODE'
            ELSE 'NAO' END auditar,
            
            
            
            inventario_id, base_id, enderecamento, cod_barra,
            cod_interno, descricao_item, valor_custo,
            saldo_estoque, qtd_inventario, qtd_divergencia,
            TRUNCATE(valor_custo*qtd_inventario,2) valor_inventario,
            TRUNCATE(valor_custo*saldo_estoque,2) valor_saldo_estoque, 
            TRUNCATE(valor_custo*qtd_divergencia,2) valor_divergente 
          FROM (
                SELECT COALESCE(b.inventario_id, c.inventario_id) inventario_id, b.id base_id, enderecamento, b.cod_barra, b.cod_interno, b.descricao_item,
                COALESCE(b.saldo_estoque, 0) saldo_estoque, COALESCE(c.qtd_inventario, 0) qtd_inventario,
                COALESCE(c.qtd_inventario, 0) - COALESCE(b.saldo_estoque, 0) qtd_divergencia, b.valor_custo
                FROM (
                SELECT id, inventario_id, cod_barra, cod_interno, saldo_estoque, valor_custo, descricao_item
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
                SELECT COALESCE(b.inventario_id, c.inventario_id) inventario_id, b.id base_id, enderecamento, c.cod_barra, b.cod_interno, b.descricao_item,
                COALESCE(b.saldo_estoque, 0) saldo_estoque, COALESCE(c.qtd_inventario, 0) qtd_inventario,
                COALESCE(c.qtd_inventario, 0) - COALESCE(b.saldo_estoque, 0) qtd_divergencia, b.valor_custo
                FROM (
                SELECT id, inventario_id, cod_barra, cod_interno, saldo_estoque, valor_custo, descricao_item 
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
          HAVING qtd_divergencia != 0
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
                title="INVENTÁRIO"
                ctTableFullWidth
                ctTableResponsive
                content={
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
                  </Table>
                }
              />
            </Col>
            <Col md={6}>
              <Card
                title="ESTOQUE"
                ctTableFullWidth
                ctTableResponsive
                content={
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

export default Dashboard;
