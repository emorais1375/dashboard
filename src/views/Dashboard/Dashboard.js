import React, { Component } from "react";
import mysql from 'mysql';
import env from '../../../.env'
// import ChartistGraph from "react-chartist";
import { Container, Row, Col, Table, Button } from "react-bootstrap";

import { Card } from "../../components/Card/Card";

const thArray = ["ID", "Código", "Qtde"];

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inventario_id: localStorage.getItem('inv_id') || '',
      inventario: [],
      base: [],
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
    this.interval = setInterval(() => {if(!this.state.isPaused) this.tick()}, 1000);
  }
  playClock(){

    this.setState({"isPaused": false, "isEnable": true});

  }
  stopClock(){
    alert(
      'Confronto\n\n' 
      + '- Cálculos do confronto:\n\n' 
      + '\t• Quantidade divergente: 0\n'  
      + '\t• Custo divergente: 0\n'  
      + '\t• Valor de Custo do inventario: 0\n'  
      + '\t• Valor divergente em venda: 0\n\n' 
      + '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n'
      + '- Relatório de confronto:\n\n'
      + '\t• Com base no modelo em anexo\n'
      + '\t• Quando a divergência for positiva deverá ser marcado com a cor azul\n'
      + '\t• Quando a divergência for negativa deverá ser marcado em vermelho\n'
      + '\t• Valores iguais continuam marcados com branco'
    );
    alert(
      'Divergência\n\n' 
      + '- Relatório de confronto:\n\n'
      + ' End\t| Cod\t| Desc\t| Qtde base\t| Qtde inventário\n'
    );
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
  }
  // createLegend(json) {
  //   var legend = [];
  //   for (var i = 0; i < json["names"].length; i++) {
  //     var type = "fa fa-circle text-" + json["types"][i];
  //     legend.push(<i className={type} key={i} />);
  //     legend.push(" ");
  //     legend.push(json["names"][i]);
  //   }
  //   return legend;
  // }
  render() {
    return (
      <div className="content">
        <h1>Dashboard</h1>
        <Container fluid>
          <Row>
            <Col lg={4}  md={6}>
              <h6>{this.state.timeFormat}</h6>
              <Button variant="info" onClick={this.playClock}>Play</Button>
              <Button variant="info" onClick={this.pauseClock}>Pause</Button>
              <Button variant="info" onClick={this.stopClock}>Stop</Button>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Card 
                // plain
                title="Inventário"
                // category="Here is a subtitle for this table"
                ctTableFullWidth
                ctTableResponsive
                content={
                  <Table striped>
                    <thead>
                      <tr>
                        {thArray.map((prop, key) => {
                          return <th key={key}>{prop}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.inventario.map((prop, key) => {
                        return (
                          <tr key={key}>
                            <td>{prop.id}</td>
                            <td>{prop.barcode}</td>
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
                // category="Here is a subtitle for this table"
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
                      {this.state.base.map((prop, key) => {
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
        {/* <Grid fluid>
          <Row>
            <Col lg={3} sm={6}>
              <StatsCard
                bigIcon={<i className="pe-7s-server text-warning" />}
                statsText="Capacity"
                statsValue="105GB"
                statsIcon={<i className="fa fa-refresh" />}
                statsIconText="Updated now"
              />
            </Col>
            <Col lg={3} sm={6}>
              <StatsCard
                bigIcon={<i className="pe-7s-wallet text-success" />}
                statsText="Revenue"
                statsValue="$1,345"
                statsIcon={<i className="fa fa-calendar-o" />}
                statsIconText="Last day"
              />
            </Col>
            <Col lg={3} sm={6}>
              <StatsCard
                bigIcon={<i className="pe-7s-graph1 text-danger" />}
                statsText="Errors"
                statsValue="23"
                statsIcon={<i className="fa fa-clock-o" />}
                statsIconText="In the last hour"
              />
            </Col>
            <Col lg={3} sm={6}>
              <StatsCard
                bigIcon={<i className="fa fa-twitter text-info" />}
                statsText="Followers"
                statsValue="+45"
                statsIcon={<i className="fa fa-refresh" />}
                statsIconText="Updated now"
              />
            </Col>
          </Row>
          <Row>
            <Col md={8}>
              <Card
                statsIcon="fa fa-history"
                id="chartHours"
                title="Users Behavior"
                category="24 Hours performance"
                stats="Updated 3 minutes ago"
                content={
                  <div className="ct-chart">
                    <ChartistGraph
                      data={dataSales}
                      type="Line"
                      options={optionsSales}
                      responsiveOptions={responsiveSales}
                    />
                  </div>
                }
                legend={
                  <div className="legend">{this.createLegend(legendSales)}</div>
                }
              />
            </Col>
            <Col md={4}>
              <Card
                statsIcon="fa fa-clock-o"
                title="Email Statistics"
                category="Last Campaign Performance"
                stats="Campaign sent 2 days ago"
                content={
                  <div
                    id="chartPreferences"
                    className="ct-chart ct-perfect-fourth"
                  >
                    <ChartistGraph data={dataPie} type="Pie" />
                  </div>
                }
                legend={
                  <div className="legend">{this.createLegend(legendPie)}</div>
                }
              />
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Card
                id="chartActivity"
                title="2014 Sales"
                category="All products including Taxes"
                stats="Data information certified"
                statsIcon="fa fa-check"
                content={
                  <div className="ct-chart">
                    <ChartistGraph
                      data={dataBar}
                      type="Bar"
                      options={optionsBar}
                      responsiveOptions={responsiveBar}
                    />
                  </div>
                }
                legend={
                  <div className="legend">{this.createLegend(legendBar)}</div>
                }
              />
            </Col>

            <Col md={6}>
              <Card
                title="Tasks"
                category="Backend development"
                stats="Updated 3 minutes ago"
                statsIcon="fa fa-history"
                content={
                  <div className="table-full-width">
                    <table className="table">
                      <Tasks />
                    </table>
                  </div>
                }
              />
            </Col>
          </Row>
        </Grid> */}
      </div>
    );
  }
}

export default Dashboard;
