import React, { Component } from "react"
//import mysql from 'mysql'
import env from '../../../.env'
import nedb from 'nedb'
var login_bd = new nedb({filename: 'login.db', autoload: true})

import LoginNavbar from "../../components/Navbars/LoginNavBar"
import MaskedFormControl from 'react-bootstrap-maskedinput'
import {
  Button,
  Form,
  Card,
  ButtonToolbar
} from 'react-bootstrap'

class Login extends Component {
  constructor(props) {
    super(props)
    this.state = {
      cpf:'234.234.234-23', password:'1234', usuario:[]
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
      /*let connection = mysql.createConnection(env.config_mysql)
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
          return
        }
        if (results.length) {
          console.log('user_id',results[0].usuario_id)
          localStorage.setItem('user_id',results[0].usuario_id)
          this.props.history.push('/inventario')
        } else {
          console.log('CPF:'+cpf+' ou Senha:'+password+' inválida!')
        }
        connection.end()
      })
      */
    } else {
      console.log('CPF:'+cpf+' ou Senha:'+password+' inválida!')
    }
  }

  render() {
        const { validated, cpf, password } = this.state;
        
        return (
        <div>
            <LoginNavbar />
            <br/>
            <br/>
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
                <br />
        </div>
        );
  }
}

export default Login;
