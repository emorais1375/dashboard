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
  Form,
  Badge,
  InputGroup
} from 'react-bootstrap'

const { ipcRenderer } = window.require('electron')

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
      descricao: '',
      enderecamento: [],
      num: []
    };
    this.handleCancel = this.handleCancel.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);  
  }
  componentDidMount() {
    this.getDescricao();
    this.getNomes();
  }
  getDescricao() {
    Promise.resolve(
      ipcRenderer.sendSync('getEndDesc', this.state.inventario_id)
    ).then(enderecamento=>{
      if (enderecamento.length) {
        const num = enderecamento.map(i=>i.descricao.split('-')[1])

        const descricao = enderecamento[0].descricao.split('-')[0]
        let final_end = Math.max(...num)
        let inicial_end = Math.min(...num)

        this.setState({enderecamento, descricao, inicial_end, final_end, num})
      }
    })
  }
  getNomes(){
    Promise.resolve(
      ipcRenderer.sendSync('getNomes', this.state.inventario_id)
    ).then((nomes)=>{
      this.setState({nomes})
      this.atualizaLista();
    })
  }
  atualizaLista() {
    let ends = [];
    let ends_user = [];
    let end_ant = {}
    Promise.resolve(
      ipcRenderer.sendSync('getUserEnd', Number(this.state.inventario_id))
    ).then((results)=>{
      if (results.length) {
        console.log(results)
        results.map(end_atual=>{
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
      })
    })
  }
  alerta(prop, key){
    let enderecamentos = prop.map(p=>p._id)
    Promise.resolve(
      ipcRenderer.sendSync('delUserEnd', enderecamentos)
    ).then((result)=>{
      if (result) {
        this.atualizaLista();
      } else {
        alert('Não foi possível remover.')
      }
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
    const {enderecamento,num} = this.state
    let inicial = this.state.inicial;
    let final = this.state.final;
    const nome = this.state.nome;
    let inventario_id = this.state.inventario_id;

    if (inicial && final && nome) {
        Promise.resolve(
          enderecamento.filter( i =>
            i.descricao.split('-')[1] >= Number(inicial) && 
            i.descricao.split('-')[1] <= Number(final)
          ).map(i=>({
            inventario_id: Number(inventario_id),
            usuario_id: this.state.nomes[nome-1].id,
            enderecamento_id: i.id,
            _enderecamento_id: i._id,
            status: "ATIVADO"
          }))
        ).then( end => {
          if(end.length) {
            console.log(end)
            Promise.resolve(
              ipcRenderer.sendSync('insertUserEnd', end)
            ).then(res =>{
              if (res) {
                this.atualizaLista()
              }
            })
          } else {
            alert('Não foi possível.')
          }
          this.handleCancel()
        })
    } else {
      alert('Preencha todos os campos!')
    }
  }
  handleCancel() {
    if (this.state.inicial || this.state.final || this.state.nome) {
      this.setState({
        nome: 0, inicial: '', final: ''
      });
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
                <div className="p-2"><Button as="input" variant="info" type="submit" value="Salvar"/></div>
                <div className="p-2"><Button as="input" variant="secondary" type="button" value="Cancelar" onClick={this.handleCancel}/></div>
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
