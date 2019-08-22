import React, { Component } from "react"
import nedb from 'nedb'
const login_bd = new nedb({filename: 'data/login.json', autoload: true})

import LoginNavbar from "../../components/Navbars/LoginNavBar"
import MaskedFormControl from 'react-bootstrap-maskedinput'
import {
  Button,
  Form,
  Card,
  ButtonToolbar,
  Modal,
} from 'react-bootstrap'
import { ipcRenderer } from "electron";

class Login extends Component {
  constructor(props) {
    super(props)
    this.state = {
      cpf:'969.342.390-91',
      password:'1234',
      usuario:[],
      showMessageErro:false,
      messageErro:'',
      isLoading:false
    }
    this.changePage = false;
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange(e) {
    const target = e.target
    const value = target.value
    const name = target.name
    this.setState({[name]: value})
  }

  handleSubmit (e) {
    e.preventDefault()
    let {cpf, password} = this.state
    if (cpf && password) {
      login_bd.findOne({cpf:cpf, password:password, login_status:'ATIVO'}, function (err, login) {
        if(login){
          console.log('user_id',login.usuario_id)
          localStorage.setItem('user_id',login.usuario_id)
          
          this.props.history.push('/inventario');
        }else{
          console.log('CPF:'+cpf+' ou Senha:'+password+' inválida!')
        }
      }.bind(this));
    } else {
      this.setState({messageErro: 'CPF ou senha inválidos, tente novamente'})
      this.handleShowMessageErro()
    }
  }

  handleCloseMessageErro(){
    this.setState({showMessageErro: false})
  }

  handleShowMessageErro(){
    this.setState({showMessageErro: true})
  }
  handleReloadDate(){
    console.log('handleReloadDate')
    // this.setState({isLoading: true})
    ipcRenderer.send('loadDB')
  }

  render() {
        const { isLoading,validated, cpf, password, showMessageErro, messageErro } = this.state;
        return (
        <div>
            <LoginNavbar />
            <br/>
            <br/>
            <div className="d-flex justify-content-center">
                <Card bg="light" style={{ width: '18rem' }}>
                    <Card.Header>Login</Card.Header>
                    <Card.Body className="p-3">
                        <Form onSubmit={this.handleSubmit}>
                            <Form.Group>
                                <Form.Label>CPF</Form.Label>
                                <MaskedFormControl type="numbe" 
                                    placeholder="CPF" mask='111.111.111-11' 
                                    name="cpf" onChange={this.handleChange} 
                                    value={cpf}
                                />
                            </Form.Group>

                            <Form.Group>
                                <Form.Label>Senha</Form.Label>
                                <Form.Control type="password" 
                                    placeholder="******" name="password" 
                                    onChange={this.handleChange} 
                                    value={password}
                                />
                            </Form.Group>

                            <ButtonToolbar>
                                <Button variant="info"  as="input" type="submit" value="Entrar" block />
                            </ButtonToolbar>
                        </Form>
                    </Card.Body>
                </Card>
                </div>
                <br />
                {/* <Button 
                  disabled={isLoading}
                  onClick={!isLoading?this.handleReloadDate.bind(this):null}
                >
                  {isLoading?'Carregando...':'Recarregar'}
                </Button> */}
                <Modal
                  size="sm"
                  show={showMessageErro}
                  onHide={this.handleCloseMessageErro.bind(this)}
                  aria-labelledby="example-modal-sizes-title-sm"
                >
                  <Modal.Header closeButton>
                    <h5>Erro ao logar</h5>
                  </Modal.Header>
                  <Modal.Body>
                    {messageErro}
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="info" onClick={this.handleCloseMessageErro.bind(this)}>OK</Button>
                  </Modal.Footer>
                </Modal>
        </div>
        );
  }
}

export default Login;
