import React, { Component } from "react";
import mysql from 'mysql';
import env from '../../../.env'
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
            cpf:'', password:'',usuario:[]
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);  
      }
    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
          });


    }
    handleSubmit (event) {
        event.preventDefault();
        console.log(
            this.state.cpf,
            this.state.password
          );
          let cpf = this.state.cpf;
          let pass = this.state.password;
          let connection = mysql.createConnection(env.config_mysql);
          // connect to mysql
        connection.connect((err) => {
            // in case of error
            if(err){
                console.log(err.code);
                console.log(err.fatal);
            }
            console.log('conectou!');
        });
  
          // Perform a query
        let query = 'SELECT l.cpf,l.password, l.usuario_id FROM login l WHERE l.cpf = ? AND l.password = ?';
  
        connection.query(query,[cpf,pass], (error, results, fields) => {
            if(error){
                console.log("An error ocurred performing the query.");
                console.log(error);
                return;
            }
            this.setState({
                usuario: results
            });
            if(results.length){
                console.log(results);
                console.log("Encontrado");
                let query2 = 'SELECT i.id FROM inventario i WHERE i.usuario_resp_cadastro_inventario_id = ?';
            
                connection.query(query2,[this.state.usuario[0].usuario_id], (error, results2, fields) => {
                    if(error){
                        console.log("An error ocurred performing the query.");
                        console.log(error);
                        return;
                    }                                   
                    console.log("Query 2 succesfully executed");
                    console.log("Vc tem um inventario");
                    console.log(results2);
                    this.props.history.push("/dashboard");                   
                });
                // Close the connection
                connection.end( () => {});
            }else{
                console.log(results);
                console.log('Nao encontrado');
                // Close the connection
                connection.end( () => {});
            }        
            
            console.log("Query 1 succesfully executed");
          });
         
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
