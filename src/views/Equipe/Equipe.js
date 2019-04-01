import React, { Component } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  OverlayTrigger,
  Tooltip,
  Button,
  ButtonToolbar,
  Form
} from 'react-bootstrap'

class Equipe extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tdArray: [
        ["1", "Dakota Rice", "$36,738", "Niger", "Oud-Turnhout"],
        ["2", "Minerva Hooper", "$23,789", "Curaçao", "Sinaai-Waas"],
        ["3", "Sage Rodriguez", "$56,142", "Netherlands", "Baileux"],
        ["4", "Philip Chaney", "$38,735", "Korea, South", "Overland Park"],
        ["5", "Doris Greene", "$63,542", "Malawi", "Feldkirchen in Kärnten"],
        ["6", "Mason Porter", "$78,615", "Chile", "Gloucester"]
      ],
      nome: 0, inicial: '', final: ''
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);  
  }
  alerta(prop, key){
    console.log('aleta ', key, prop)
    let tdArray = this.state.tdArray;
    tdArray.splice(key, 1)
    this.setState({
      tdArray: tdArray
    })
  }
  handleChange(ev) {
    const target = ev.target;
    const value = target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }
  handleSubmit(ev) {
    ev.preventDefault();
  }
  render() {
    const thArray = ["#", "Name", "Salary", "Country", "City","Actions"];
    const edit = <Tooltip id="edit_tooltip">Edit Task</Tooltip>;
    const remove = <Tooltip id="remove_tooltip">Remove</Tooltip>;
    return (
    <div className="content">
        <h1>Equipe</h1>
        <Container fluid>
          <Row>
            <Col md={12}>
              <Form onSubmit={this.handleSubmit}>
                <Form.Row>
                  <Form.Group as={Col}>
                    <Form.Label>Nome</Form.Label>
                    <Form.Control as="select" name="nome" onChange={this.handleChange}>
                      <option value="0">Selecione</option>
                      <option value="1">Dakota Rice</option>
                      <option value="2">Minerva Hooper</option>
                      <option value="3">Sage Rodriguez</option>
                      <option value="4">Philip Chaney</option>
                      <option value="5">Doris Greene</option>
                      <option value="6">Mason Porter</option>
                    </Form.Control>
                </Form.Group>

                  <Form.Group as={Col}>
                      <Form.Label>Inicial</Form.Label>
                      <Form.Control placeholder="Inicial" type="text" name="inicial" onChange={this.handleChange}/>
                  </Form.Group>

                  <Form.Group as={Col}>
                  <Form.Label>Final</Form.Label>
                  <Form.Control placeholder="Final" type="text" name="final" onChange={this.handleChange}/>
              </Form.Group>
                </Form.Row>
                <ButtonToolbar>
                <Button as="input" variant="info" type="submit" value="Salvar"/>
                <Button as="input" variant="info" type="button" value="Cancelar"/>
                </ButtonToolbar>
              </Form>
            </Col>
            <Col md={12}>
              <Table striped>
                <thead>
                  <tr>
                    {thArray.map((prop, key) => {
                      return <th key={key}>{prop}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                    {this.state.tdArray.map((prop, key) => {
                      return <tr key={key}>
                        {prop.map((prop, key) => {
                          return <td key={key}>{prop}</td>;
                        })}
                        <td>
                          <OverlayTrigger overlay={edit}>
                            <Button variant="info">
                              <i className="fa fa-times" />
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger overlay={remove}>
                            <Button variant="danger" onClick={() => this.alerta(prop, key)}>
                              <i className="fa fa-times" />
                            </Button>
                          </OverlayTrigger>
                        </td>
                      </tr>;
                    })}
                </tbody>
              </Table>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default Equipe;
