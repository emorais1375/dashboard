import React, { Component } from "react";
import MaskedFormControl from 'react-bootstrap-maskedinput'
import {
    Button,
    Form,
    Card
  } from 'react-bootstrap'

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cpf:'', password:'',validated: false 
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);  
      }
    handleChange(event) {
        console.log(event.target.value)
        console.log(event.target.name)
        this.setState({
            [event.target.name]: event.target.value
          });


    }
    handleSubmit(event) {
        event.preventDefault();
        console.log(
            this.state.cpf,
            this.state.password
          );
    }
    render() {
        return (
        <div className="col-md-3">
            <br/>
            <br/>
                <Card bg="light" style={{ width: '18rem' }}>
                    <Card.Header>Login</Card.Header>
                    <Card.Body className="p-3">
                        <Form onSubmit={e => this.handleSubmit(e)}>
                            <Form.Group controlId="formBasicCPF">
                                <Form.Label>CPF</Form.Label>
                                <MaskedFormControl type="text" placeholder="___.___.___-__" mask='111.111.111-11' name="cpf" onChange={this.handleChange} value={this.state.cpf} />
                            </Form.Group>

                            <Form.Group controlId="formBasicSenha">
                                <Form.Label>Senha</Form.Label>
                                <Form.Control  type="password" placeholder="******" name="password" onChange={this.handleChange} value={this.state.password}/>
                            </Form.Group>
                            <Button variant="info" type="submit" value="Entrar">Entrar</Button>
                        </Form>
                    </Card.Body>
                </Card>
                <br />
        </div>
        );
  }
}

export default Login;
