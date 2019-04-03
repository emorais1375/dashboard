import React, { Component } from "react";
import mysql from 'mysql';
import env from '../../../.env'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'
import { FormCheck } from "react-bootstrap";

class Enderecamento extends Component {
    constructor(props) {
        super(props);
        this.state = {
          enderecamento: []
        }; 
        this.checkboxHandler = this.checkboxHandler.bind(this); 
    }
    componentDidMount() {
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
        let query = 'SELECT e.id, e.descricao, e.excecao FROM enderecamento e LIMIT 0,5';

        connection.query(query, (error, results, fields) => {
            if(error){
                console.log("An error ocurred performing the query.");
                console.log(error);
                return;
            }
            console.log(results);
            this.setState({
                enderecamento: results
            });
            console.log("Query succesfully executed");
        });
        // Close the connection
        connection.end( () => {
            // The connection has been closed
        });
    }
    checkboxHandler(ev) {
      }

  render() {
    return (
      <div>
        <h1>Enderecamento</h1>
        <Table responsive="sm">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Endereço</th>
                    <th>Excecao</th>
                </tr>
            </thead>
            <tbody>
                {this.state.enderecamento.map((prop,key) => {
                    return (
                        <tr key={key}>
                            <td>{prop.id}</td>
                            <td>{prop.descricao}</td>
                            <td>
                                <Form.Check defaultChecked={prop.excecao === 'SIM'? true:false}   />
                            </td>
                        </tr>
                    );
                })}                       
            </tbody>
        </Table>
      </div>
    );
  }
}

export default Enderecamento;