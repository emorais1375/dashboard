import React, { Component } from "react";
import mysql from 'mysql';
import env from '../../../.env'
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
      tdArray2: [
      ],
      nomes: [],
      nome: 0, inicial: '', final: '', user_inv: []
    };
    this.handleCancel = this.handleCancel.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);  
  }
  componentDidMount() {
    let connection = mysql.createConnection(env.config_mysql);
    let sql = "\
    SELECT DISTINCT l.usuario_id 'id', u.nome\
    FROM login l, usuario u\
    WHERE l.login_status = 'ATIVO'\
    AND l.usuario_id = u.id\
    AND u.cargo = 'INVENTARIANTE'";
    connection.query(sql, (error, results, fields)=>{
      if(error) {
        console.log(error.code,error.fatal);
        return;
      }
      this.setState({
        nomes: results
      })
      sql = "\
      select ue.*, e.descricao, u.nome \
      from usuario_enderecamento ue, enderecamento e, usuario u \
      where ue.inventario_id = 1 AND ue.enderecamento_id = e.id\
      AND ue.usuario_id = u.id";
      connection.query(sql, (error, results, fields)=>{
        if(error) {
          console.log(error.code,error.fatal);
          return;
        }
        let ends = [];
        let ends_user = [];
        let s = {}

        if (results.length) {
          results.map(end_atual=>{

            console.log('entro')
            if (ends.length) {
              end_ant = ends[ends.length-1]; // ultimo enderecamento
              if (end_atual.usuario_id === end_ant.usuario_id) {
                if (parseInt(end_atual.descricao.split('-')[1]) !== parseInt(end_ant.descricao.split('-')[1]) + 1) {
                  ends_user.push(ends);
                  ends = [];
                }
                ends.push(end_atual);
              } else {
                ends_user.push(ends);
                ends = [];
                ends.push(end_atual);
              }
            }
            else{
              ends.push(end_atual);
            }
          });
          ends_user.push(ends);
        }
        this.setState({
          tdArray2: ends_user
        });
        if (ends_user.length) {
          ends_user.map(end => {
            if (end.length) {
              console.log(end[0].nome)
              console.log(end[0].descricao)
              console.log(end[end.length-1].descricao)
            }
          });
        }
        connection.end();
      });
    });
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
        this.state.nomes[this.state.nome-1].nome,
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
                      {this.state.nomes.map((prop, key) => {
                        return <option key={key} value={key+1}>{prop.nome}</option>;
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
                    {this.state.tdArray2.map((prop, key) => {
                      return <tr key={key}>
                        <td>{prop[0].nome}</td>
                        <td>{prop[0].descricao}</td>
                        <td>{prop[prop.length-1].descricao}</td>
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
