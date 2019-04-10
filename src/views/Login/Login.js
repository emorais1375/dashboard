import React, { Component } from "react";
import MaskedFormControl from 'react-bootstrap-maskedinput'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cpf='', password=''
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);  
      }
    render() {
    return (
      <div className="col-md-3">
        <br/>
        <br/>
            <Card bg="light" style={{ width: '18rem' }}>
                <Card.Header>Login</Card.Header>
                <Card.Body className="p-3">
                    <Form>
                        <Form.Group controlId="formBasicCPF">
                            <Form.Label>CPF</Form.Label>
                            <MaskedFormControl type="text" placeholder="___.___.___-__" name="cpf" mask='111.111.111-11' onChange={this.handleChange} value={this.state.cpf}/>
                        </Form.Group>

                        <Form.Group controlId="formBasicSenha">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" placeholder="******" />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Entrar
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
            <br />
      </div>
    );
  }
}

export default Login;
