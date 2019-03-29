import React from 'react';
import mysql from 'mysql';

class HelloWorld extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      agendamento: []
    }

    this.handleOnClick = this.handleOnClick.bind(this);
  }
  handleOnClick(){
    console.log('handleOnClick');
    let connection = mysql.createConnection({
      host     : 'localhost',
      user     : 'root',
      password : null,
      database : 'arko_db_v2'
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
    let query = 'SELECT id, contrato_id, data_agendamento, hora_agendamento, usuario_id, agendamento_status FROM agendamento LIMIT 10';

    connection.query(query, (error, results, fields) => {
        if(error){
            console.log("An error ocurred performing the query.");
            console.log(error);
            return;
        }

        console.log(results);
        this.setState({
          agendamento: results
        });

        console.log("Query succesfully executed");
    });

    // Close the connection
    connection.end( () => {
        // The connection has been closed
    });
  }

  render(){
    return(
      <div>
        <h1>Connecting to MySQL</h1>
        <button onClick={this.handleOnClick}>Retrieve 10 first rows in the database</button>
        <table className="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Gerente ID</th>
                        <th>Status</th>
                        <th>Contrato ID</th>
                        <th>Data</th>
                        <th>Hora</th>
                    </tr>
                </thead>
                <tbody>
                    {this.state.agendamento.map(prop => {
                      return(
                        <tr key={prop.id}>
                          <td>{prop.id}</td>
                          <td>{prop.usuario_id}</td>
                          <td>{prop.agendamento_status}</td>
                          <td>{prop.contrato_id}</td>
                          <td>{prop.data_agendamento}</td>
                          <td>{prop.hora_agendamento}</td>
                        </tr>
                      );
                    })}
                    
                </tbody>
            </table>
      </div>
    );
  }
}

export default HelloWorld;