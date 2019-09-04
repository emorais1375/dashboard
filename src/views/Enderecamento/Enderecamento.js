import React, { Component } from "react";
import { 
    Container, 
    Col, 
    Form, 
    Table,
    ButtonToolbar,
    Button,
    Row
} from "react-bootstrap";
import { truncateSync } from "fs";
const { ipcRenderer } = window.require('electron')
class Enderecamento extends Component {
    constructor(props) {
        super(props);
        this.state = {
            enderecamento: [],
            tipo_inventario: localStorage.getItem('inv_tipo') || '',
            prefixo: '',
            ultimo_id: '',
            inicial: '', final: '',
            inventario_id: localStorage.getItem('inv_id') || '',
        }; 
        this.handleChange = this.handleChange.bind(this);
        this.handleChange2 = this.handleChange2.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }
    componentDidMount() {
        this.atualizaLista();
    }
    atualizaLista() {
        Promise.resolve(
          ipcRenderer.sendSync('getEnd', this.state.inventario_id)
        ).then((enderecamento)=>{
            this.setState({enderecamento: enderecamento.sort((b,a)=>{
                return a.descricao.split('-')[1] - b.descricao.split('-')[1]
            })})
            if(enderecamento.length){
                const prefixo = enderecamento[0].descricao.split('-')[0]
                const inicial = Math.max(...enderecamento.map(i=>i.descricao.split('-')[1]))
                const ultimo_id = Math.max(...enderecamento.map(i=>i.id))
                this.setState({prefixo, inicial, ultimo_id})
            }
        })
    }
    handleChange2(ev) {
        const target = ev.target
        const value = target.value
        const name = target.name
        this.setState({
          [name]: value
        })
    }
    handleChange(ev, key) {
        const checked = ev.target.checked
        const enderecamento = this.state.enderecamento.slice()
        const _id = enderecamento[key]._id
        const excecao = checked ? 'SIM' : 'NAO'
        Promise.resolve(
            ipcRenderer.sendSync('updateEnd', {excecao, _id})
        ).then((res)=>{
            if(res){
                enderecamento[key].excecao = excecao
                this.setState({enderecamento})
            }
        })
      }
    handleSubmit(ev) {
        ev.preventDefault()
        let final = this.state.final
        final = parseInt(final)
        let inicial = this.state.inicial
        inicial = parseInt(inicial)
        let ultimo_id = this.state.ultimo_id
        ultimo_id = parseInt(ultimo_id)
        let prefixo = this.state.prefixo
        const enderecamento = this.state.enderecamento.slice()
        let enderecamentos = []
        let descricao
        const descricao_proprietario = ''
        const excecao = 'NAO'
        const inventario_id = this.state.inventario_id
        if (final > inicial) {
            for (let i = inicial+1; i <= final; i++) {
                descricao = `${prefixo}-${(i).toString().length === 1?'0' + i:i}`
                enderecamentos.push({
                    id:  Number(ultimo_id+i-inicial),
                    inventario_id: Number(inventario_id),
                    descricao,
                    descricao_proprietario,
                    excecao,
                    novo: true
                })
            }
            console.log(enderecamentos)
            Promise.resolve(
                ipcRenderer.sendSync('insertEnd', enderecamentos)
            ).then(res=>{
                if(res){
                    this.atualizaLista();
                    this.handleCancel();
                }
            })
        } else {
            alert('Entrada invalida!')
        }
    }
    handleCancel() {
        if (this.state.final) {
            this.setState({final: ''})
        }
    }
  render() {
    const tipo_inventario = this.state.tipo_inventario;
    let thArray;
    let tbody;
    return (
      <div>
        <h1>Enderecamento</h1>
        <Container fluid>
          <Row>
            <Col md={12}>
                <Form onSubmit={this.handleSubmit}>
                    <Form.Row>
                        <Form.Group as={Col} md="4">
                            <Form.Label>Prefixo</Form.Label>
                            <Form.Control  readOnly defaultValue={this.state.prefixo} />
                        </Form.Group>

                        <Form.Group as={Col} md="4">
                            <Form.Label>Início</Form.Label>
                            <Form.Control readOnly defaultValue={this.state.inicial} />
                        </Form.Group>

                        <Form.Group as={Col} md="4">
                            <Form.Label>Final</Form.Label>
                            <Form.Control placeholder="Final" type="number" name="final"  onChange={this.handleChange2} value={this.state.final} />
                        </Form.Group>
                    </Form.Row>
                    <ButtonToolbar>
                        
                    <div className="p-2"><Button as="input" variant="info" type="submit" value=" Salvar "/></div>
                    <div className="p-2"><Button as="input" variant="secondary" type="button" value=" Cancelar " onClick={this.handleCancel}/></div>

                    </ButtonToolbar>
                </Form>
            </Col>
            <Col md={12} style={{
                overflow: 'auto',
                height: '383px'
            }}>
                <Table  striped>
                    <thead>
                        <tr>
                            <th>Endereço</th>
                            <th>Excecao</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.enderecamento.map((prop,key) => {
                            return (
                                <tr key={prop._id}>
                                    <td>{prop.descricao}</td>
                                    <td >
                                        <Form.Check 
                                            checked={prop.excecao === 'SIM'? true:false}
                                            onChange={e => this.handleChange(e, key)}/>
                                    </td>
                                </tr>
                            );
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

export default Enderecamento;