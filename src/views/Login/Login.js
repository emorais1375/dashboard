import React, { Component } from "react"
import mysql from 'mysql'
import env from '../../../.env'

import LoginNavbar from "../../components/Navbars/LoginNavBar"
import MaskedFormControl from 'react-bootstrap-maskedinput'
import {
  Button,
  Form,
  Card,
  ButtonToolbar,
  Modal,
  Row,
  Col
} from 'react-bootstrap'

class Login extends Component {
  constructor(props) {
    super(props)
    this.state = {
    
      cpf:'009.441.122-00', password:'1234', usuario:[], showMessageErro:false, messageErro:''
    }
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
      let connection = mysql.createConnection(env.config_mysql)
      let query = `
        SELECT usuario_id 
        FROM login 
        WHERE cpf=? 
        AND password=? 
        AND login_status='ATIVO'
      `
    
      connection.query(query, [cpf, password], (error, results, fields) => {
        if(error){
          console.log(error.code,error.fatal)
          this.setState({messageErro: 'Não foi possível realizar login, tente novamente mais tarde'})
          this.handleShowMessageErro()
          return
        }
        if (results.length) {
          console.log('user_id',results[0].usuario_id)
          localStorage.setItem('user_id',results[0].usuario_id)
          this.props.history.push('/inventario')
        } else {
          console.log('CPF:'+cpf+' ou Senha:'+password+' inválida!')
          this.setState({messageErro: 'CPF ou senha inválidos, tente novamente'})
          this.handleShowMessageErro()
        }
        connection.end()
      })
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

  render() {
        const { validated, cpf, password, showMessageErro, messageErro } = this.state;
        return (
        <div>
            <LoginNavbar />
            <br/>
            <br/>
            <div class="d-flex justify-content-center">
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
