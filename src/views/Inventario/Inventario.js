import React, { Component } from "react";
import mysql from 'mysql';
import env from '../../../.env'

import InventNavbar from "../../components/Navbars/InventNavbar"
import {
	Container,
	Table,
	Tooltip,
	OverlayTrigger,
	Button
} from "react-bootstrap"
class Inventario extends Component {
	constructor(props){
    super(props);
    this.state = {
    	usuario_coordenador_id: localStorage.getItem('user_id') || '',
    	nome: 'coordenador-usu',
    	inventarios: []
    }
    if(props.location.state){
    	this.state = {
    		usuario_coordenador_id: props.location.state['id'],
    		nome: props.location.state['nome'],
    		inventarios: []
    	}
    }
    this.abrirInventario = this.abrirInventario.bind(this)
  }

  componentDidMount() {
  	const {usuario_coordenador_id} = this.state
  	if (usuario_coordenador_id) {
      let connection = mysql.createConnection(env.config_mysql);
  		let query = `
  			SELECT 
  				i.id,
  				data_agendamento as 'data',
  				hora_agendamento as 'hora',
  				agendamento_status as 'status',
          i.tipo_inventario
  			FROM 
  				inventario i, agendamento a 
  			WHERE 
  				usuario_coordenador_id = ?
  			AND 
  				i.agendamento_id = a.id
  		`
  		connection.query(query, [usuario_coordenador_id],(error, inventarios, fields)=>{
	      if(error) {
	        console.log(error.code,error.fatal);
	        return;
	      }
	      this.setState({inventarios})
	      connection.end();
	    })
  	} else {
  		console.log('Vazio!')
  	}
  }

  abrirInventario(e, inv_id, inv_tipo) {
    console.log('inv_id:',inv_id)
    console.log('inv_tipo:',inv_tipo)
    localStorage.setItem('inv_id', inv_id)
    localStorage.setItem('inv_tipo', inv_tipo)
    this.props.history.push('/admin/dashboard')
  }

  render() {
  	const { nome, inventarios, usuario_coordenador_id} = this.state
    const abrir = <Tooltip id="remove_tooltip">Abrir</Tooltip>;
    return (
      <div className="content">
        <InventNavbar />
        <h1>Inventario de {nome}</h1>
        	<Container fluid>
        		<Table striped size="sm" responsive>
              <thead>
              	<tr>
              		<th>Data e Hora</th>
              		<th>Status</th>
              		<th>Ação</th>
                </tr>
              </thead>
              <tbody>
              	{inventarios.map(prop=>{
              		return <tr key={prop.id}>
              			<td>{prop.data} - {prop.hora}</td>
              			<td>{prop.status}</td>
              			<td>
                      <Button variant="danger" onClick={e => this.abrirInventario(e, prop.id, prop.tipo_inventario)}>
                        Inventário
                      </Button>
              			</td>
              		</tr>;
              	})}  
              </tbody>
            </Table>
        	</Container>
      </div>
    );
  }
}

export default Inventario;