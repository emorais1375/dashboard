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
      ],
      nomes: [
        "Dakota Rice",
        "Minerva Hooper",
        "Sage Rodriguez",
        "Philip Chaney",
        "Doris Greene",
        "Mason Porter"
      ],
      nome: 0, inicial: '', final: ''
    };
    this.handleCancel = this.handleCancel.bind(this);
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
    console.log('handleSubmit()')
    ev.preventDefault();
    if (this.state.inicial && this.state.final && this.state.nome) {
      console.log(
        this.state.nome,
        this.state.inicial,
        this.state.final
      );
      let tdArray = this.state.tdArray;
      tdArray.push([
        this.state.nomes[this.state.nome-1],
        this.state.inicial,
        this.state.final
      ]);
      this.setState({
        tdArray: tdArray
      })
      this.handleCancel();
    }
  }
  handleCancel() {
    console.log('handleCancel()')
    if (this.state.inicial || this.state.final || this.state.nome) {
      this.setState({
        nome: 0, inicial: '', final: ''
      });
      console.log('limpar!')
    }
  }
  render() {
    const thArray = ["Name", "Inicial", "Final","Actions"];
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
                  <Form.Group as={Col} md="6">
                    <Form.Label>Nome</Form.Label>
                    <Form.Control as="select" name="nome" onChange={this.handleChange} value={this.state.nome}>
                    <option value="0">Selecione</option>
                      {this.state.nomes.map((nome, key) => {
                        return <option key={key} value={key+1}>{nome}</option>;
                      })}
                    </Form.Control>
                </Form.Group>

                  <Form.Group as={Col} md="3">
                      <Form.Label>Inicial</Form.Label>
                      <Form.Control placeholder="Inicial" type="text" name="inicial" onChange={this.handleChange} value={this.state.inicial}/>
                  </Form.Group>

                  <Form.Group as={Col} md="3">
                  <Form.Label>Final</Form.Label>
                  <Form.Control placeholder="Final" type="text" name="final" onChange={this.handleChange} value={this.state.final}/>
              </Form.Group>
                </Form.Row>
                <ButtonToolbar>
                <Button as="input" variant="info" type="submit" value="Salvar"/>
                <Button as="input" variant="info" type="button" value="Cancelar" onClick={this.handleCancel}/>
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
