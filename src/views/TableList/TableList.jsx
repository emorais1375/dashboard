import React, { Component } from "react";
import ChartistGraph from "react-chartist";
import { Grid, Row, Col, Table } from "react-bootstrap";
import Button from 'components/CustomButton/CustomButton';
import Card from "components/Card/Card.jsx";
import { StatsCard } from "components/StatsCard/StatsCard.jsx";
// import { thArray, tdArray } from "variables/Variables.jsx";
import {
  // dataBar,
  // optionsBar,
  // responsiveBar,
  legendBar
} from "variables/Variables.jsx";
const thArray = ["ID", "Código", "Qtde"];
// Data for Bar Chart
var dataBar = {
  
  labels: ['Total', 'José', 'Ricardo', 'Monica', 'Eduard'],
  series: [
    [5, 2, 4, 2, 1]
  ]
};
var optionsBar = {
  seriesBarDistance: 10,
  axisX: {
    // showGrid: false,
    showLabel: false
  },
  axisY: {
    showGrid: false,
    position: "left"
  },
  height: "245px",
  horizontalBars: true
};
var responsiveBar = [
  [
    "screen and (max-width: 640px)",
    {
      seriesBarDistance: 5,
      axisX: {
        labelInterpolationFnc: function(value) {
          return value[0];
        }
      }
    }
  ]
];

class TableList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      response: [], inventario: [],
      isPaused: true,
      horas: 0, minutos: 0, segundos: 0,
      isEnable: false, 
      timeFormat: '00:00:00',
      items: [], text: ''
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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
    // this.interval = setInterval(() => this.tick(), 1000);
    this.callApi()
      .then(res => this.setState({ response: res }))
      .catch(err => console.log(err));
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }
  callApi = async () => {
    const response = await fetch('/products');
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);

    return body;
  };
  render() {
    return (
      <div className="content">
        <Grid fluid>
          <Row>
            <form onSubmit={this.handleSubmit}>
              <input
                onChange={this.handleChange}
                value={this.state.text}
              />
              <button>
                Enviar codigo
              </button>
            </form>
            
            
            {/* <Button onClick={this.playClock.bind(this)}>Iniciar</Button>
            <Button onClick={this.pauseClock.bind(this)}>Pausar</Button>
            <Button onClick={this.stopClock.bind(this)}>Parar</Button> */}
            {/* <h1>{this.state.horas+":"+this.state.minutos+":"+this.state.segundos}</h1> */}
            {/* <h1>{this.state.timeFormat}</h1> */}
              
            {/* <Button onClick={this.handleSubmit}>Remover o primeiro</Button> */}
            <Col lg={4}  md={6}>
            <StatsCard 
              bigIcon={<i className="pe-7s-stopwatch text-warning" />}
              statsText="Time"
              statsValue={this.state.timeFormat}
              statsIcon={
                <div>
                  <i className="fa fa-play" onClick={this.playClock.bind(this)}/>
                  <i className="fa fa-refresh" onClick={this.pauseClock.bind(this)}/>
                  <i className="fa fa-check" onClick={this.stopClock.bind(this)}/>
                </div>
              }
              // statsIconText="Updated now"
            />
            </Col>
            <Col md={6}>
              <Card
                id="chartActivity"
                title="Andamento"
                // category="All products including Taxes"
                // stats="Data information certified"
                // statsIcon="fa fa-check"
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
              />
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
                        {thArray.map((prop, key) => {
                          return <th key={key}>{prop}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.response.map((prop, key) => {
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
          </Row>
        </Grid>
      </div>
    );
  }
  handleChange(e) {
    this.setState({ text: e.target.value });
  }
  handleSubmit(e) {
    e.preventDefault();
    let text = this.state.text;
    if (!text.length || !this.state.isEnable) {
      return;
    }
    let base = this.state.response.slice();
    let inve = this.state.inventario.slice();
    let qtd_inve = 0;
    const res_base = base.filter((item) => {
      if (item.barcode === text){
        item.qtd--;
        if(item.qtd > 0){ 
          qtd_inve = 1;
          return true;
        }
        return false; // Remove quando qtd for igual a 0
      }
      return true;
    });
    if(res_base.length === base.length && !qtd_inve){ // Se codebar e qtd se manter constante na base
      const res_inve = inve.filter(item => {
        if(item.barcode === text){
          item.qtd++;
          return false;
        }
        return true;
      });
      if (res_inve.length === inve.length) {
        inve.push({
          id: 1,
          barcode: text,
          qtd: 1
        });        
      }
      this.setState({inventario: inve});
    }
    this.setState({response: res_base});
  }

}

export default TableList;
