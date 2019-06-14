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
  Form,
  Badge,
  InputGroup
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
      nome: 0, inicial: '', final: '', user_inv: [],
      inventario_id: localStorage.getItem('inv_id') || '',
      inicial_end: '', final_end: '',
      descricao: ''
    };
    this.handleCancel = this.handleCancel.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);  
  }
  componentDidMount() {
    this.getDescricao();
    this.atualizaLista();
  }
  getDescricao() {
    let {inventario_id} = this.state
    if (inventario_id) {
      let connection = mysql.createConnection(env.config_mysql);
      let sql = "\
      select descricao 'desc'\
      from enderecamento\
      where id IN (\
      ( select min(id) from enderecamento where inventario_id=?),\
      ( select max(id) from enderecamento where inventario_id=?))";
      connection.query(sql, [inventario_id, inventario_id], (error, results, fields)=>{
        if(error) {
          console.log(error.code,error.fatal);
          return;
        }
        if (results.length === 2) {
          const descricao = results[0].desc.split('-')[0];
          const inicial_end = results[0].desc.split('-')[1];
          const final_end = results[1].desc.split('-')[1];
          console.log(descricao);
          this.setState({descricao, inicial_end, final_end});
        }else if (results.length) {
          const descricao = results[0].desc.split('-')[0];
          const inicial_end = results[0].desc.split('-')[1];
          const final_end = results[0].desc.split('-')[1];
          console.log(descricao);
          this.setState({descricao, inicial_end, final_end});
        }
        connection.end();
      });
    } else {
      console.log('Vazio!')
    }
  }
  atualizaLista() {
    let connection = mysql.createConnection(env.config_mysql);
    let inventario_id = this.state.inventario_id;
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
      this.setState({nomes: results})
      sql = "\
      select ue.*, e.descricao, u.nome \
      from usuario_enderecamento ue, enderecamento e, usuario u \
      where ue.inventario_id = ? AND ue.tipo = 'INVENTARIO'\
      AND ue.enderecamento_id = e.id\
      AND ue.usuario_id = u.id";
      connection.query(sql, [inventario_id], (error, results, fields)=>{
        if(error) {
          console.log(error.code,error.fatal);
          return;
        }
        let ends = [];
        let ends_user = [];
        let end_ant = {}

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
    let enderecamentos = [];
    prop.map(p=>{
      enderecamentos.push([p.id]);
    });
    console.log(enderecamentos)
    if (enderecamentos) {
      let connection = mysql.createConnection(env.config_mysql);
      let sql = "\
      DELETE FROM usuario_enderecamento WHERE id IN (?)";
      connection.query(sql, [enderecamentos], (error, results, fields)=>{
        if(error) {
          console.log(error.code,error.fatal);
          return;
        }
        this.atualizaLista();
        connection.end();
      });
    }
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
    let inicial = this.state.inicial;
    let final = this.state.final;
    const nome = this.state.nome;
    let inventario_id = this.state.inventario_id;
    let enderecamentos = [];

    if (inicial && final && nome) {
      const usuario_id = this.state.nomes[nome-1].id;
      inicial = this.state.descricao + '-' +inicial;
      final = this.state.descricao + '-' +final;
      console.log(
        usuario_id,
        inicial,
        final
      );
      let connection = mysql.createConnection(env.config_mysql);
      let sql = "\
      SELECT id, descricao  FROM enderecamento\
      WHERE inventario_id=? AND id >= (\
      SELECT id FROM enderecamento\
      WHERE inventario_id=? AND descricao=?)\
      AND id <= ( SELECT id FROM enderecamento\
      WHERE inventario_id=?  AND descricao=?)";
      connection.query(sql, [inventario_id, inventario_id, inicial, inventario_id, final], (error, results, fields)=>{
        if(error) {
          console.log(error.code, error.fatal);
          return;
        }
        console.log('id', results);
        results.map(result => {
          enderecamentos.push([
            inventario_id,
            usuario_id,
            result.id,
            'INVENTARIO'
          ]);
          console.log('end:'+result.id)
          console.log('use:'+usuario_id)
          console.log('inv:'+inventario_id)
        })
        if (enderecamentos.length) {
          sql = "\
          INSERT INTO usuario_enderecamento (inventario_id, usuario_id, enderecamento_id, tipo)\
          VALUES ?";
          connection.query(sql, [enderecamentos], (error, results, fields)=>{
            if(error) {
              console.log('Puts:',error.code, error.fatal);
              return;
            }
            this.atualizaLista();
            this.handleCancel();
            connection.end();
          });  
        }
        else{
          connection.end();
        }
      });
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
                    <Form.Label>Inicial <Badge variant="secondary">{this.state.inicial_end}</Badge></Form.Label>
                    <InputGroup>
                      <InputGroup.Prepend>
                        <InputGroup.Text>{this.state.descricao}-</InputGroup.Text>
                      </InputGroup.Prepend>
                      <Form.Control placeholder="Inicial" type="number" name="inicial" onChange={this.handleChange} value={this.state.inicial}/>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group as={Col} md="3">
                    <Form.Label>Final <Badge variant="secondary">{this.state.final_end}</Badge></Form.Label>
                    <InputGroup>
                      <InputGroup.Prepend>
                        <InputGroup.Text>{this.state.descricao}-</InputGroup.Text>
                      </InputGroup.Prepend>
                      <Form.Control placeholder="Final" type="number" name="final" onChange={this.handleChange} value={this.state.final}/>
                    </InputGroup>
                  </Form.Group>
                </Form.Row>
                <ButtonToolbar>
                <div class="p-2"><Button as="input" variant="info" type="submit" value="Salvar"/></div>
                <div class="p-2"><Button as="input" variant="secondary" type="button" value="Cancelar" onClick={this.handleCancel}/></div>
                </ButtonToolbar>
              </Form>
            </Col>
            <Col md={12} style={{
                overflow: 'auto',
                height: '360px'
            }}>
              <Table striped size="sm" responsive>
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
                          <OverlayTrigger overlay={remove}>
                           
                            <button onClick={() => this.alerta(prop, key)} className = "text-light bg-danger rounded">
                              x
                            </button>
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
