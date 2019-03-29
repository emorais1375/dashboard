import React from 'react';
import mysql from 'mysql';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'


class HelloWorld extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      equipe_nome: [], equipe_enderecamento: []
    }

    this.handleOnClick = this.handleOnClick.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this)
  }
 
  handleOnClick(){
    console.log('handleOnClick');
    let connection = mysql.createConnection({
      host     : 'localhost',
      user     : 'root',
      password : null,
      database : 'db_teste'
    });

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
    let query_nome = 'SELECT i.id, u.nome, e.descricao, u.id FROM inventario i, usuario u, usuario_enderecamento ue, enderecamento e WHERE i.id = 6 AND u.cargo = "INVENTARIANTE" AND ue.usuario_id = u.id AND ue.usuario_id = e.inventario_id GROUP by u.nome';

    connection.query(query_nome, (error, results, fields) => {
        if(error){
            console.log("An error ocurred performing the query.");
            console.log(error);
            return;
        }

        console.log(results);
        this.setState({
          equipe_nome: results
        });

        console.log("Query succesfully executed");
    });
    let query_enderecamento = 'SELECT i.id, u.nome, e.descricao, u.id FROM inventario i, usuario u, usuario_enderecamento ue, enderecamento e WHERE i.id = 6 AND u.cargo = "INVENTARIANTE" AND ue.usuario_id = u.id AND ue.usuario_id = e.inventario_id';

    connection.query(query_enderecamento, (error, results, fields) => {
        if(error){
            console.log("An error ocurred performing the query.");
            console.log(error);
            return;
        }

        console.log(results);
        this.setState({
          equipe_enderecamento: results
        });

        console.log("Query succesfully executed");
    });
    // Close the connection
    connection.end( () => {
        // The connection has been closed
    });
  }
  handleSubmit(event) {
    console.log('handleSubmit');
    let connection = mysql.createConnection({
      host     : 'localhost',
      user     : 'root',
      password : null,
      database : 'db_teste'
    });

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
    //let query_insert = 'INSERT INTO usuario_enderecamento (id, inventario_id, usuario_id, enderecamento_id) VALUES (NULL, inventario_id, usuario_id, enderecamento_id);';

    connection.query(query_insert, (error, results, fields) => {
        if(error){
            console.log("An error ocurred performing the query.");
            console.log(error);
            return;
        }

        console.log("Query succesfully executed");
    });
      // Close the connection
      connection.end( () => {
        // The connection has been closed
    });
  }
  render() {
    return(
      <div>
        <h1>Equipe</h1>
        <Button variant="dark" onClick={this.handleOnClick}>Carregar</Button>
        <Form>
          <Form.Row>
              <Col>
                <Form.Group controlId="exampleForm.ControlSelect1">
                  <Form.Label>INVENTARIANTE</Form.Label>
                  <Form.Control as="select">
                    {this.state.equipe_nome.map(prop => {
                      return(
                        <option key={prop.nome}>{prop.nome}</option>
                      );
                    })}                  
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="exampleForm.ControlSelect2">
                    <Form.Label>FAB. INICIAL</Form.Label>
                    <Form.Control type="number"></Form.Control>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="exampleForm.ControlSelect3">
                    <Form.Label>FAB.FINAL</Form.Label>
                    <Form.Control type="number"></Form.Control>
                </Form.Group>
              </Col>
              <Col><Button type="submit" onClick={this.handleOnClick}>+</Button></Col>
          </Form.Row>
        </Form>
      </div>
    );
  }
}
export default HelloWorld;