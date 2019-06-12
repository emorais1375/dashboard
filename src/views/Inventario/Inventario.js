import React, { Component } from "react";
const { ipcRenderer } = window.require('electron')
import mysql from 'mysql';
import env from '../../../.env'
import nedb from 'nedb'
var inventario_db = new nedb({filename: 'inventario.db', autoload: true})
var agendamento_db = new nedb({filename: 'agendamento.db', autoload: true})

import InventNavbar from "../../components/Navbars/InventNavBar"
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
    	inventarios: []
    }
    if(props.location.state){
    	this.state = {
    		usuario_coordenador_id: props.location.state['id'],
    		inventarios: []
    	}
    }
    this.abrirInventario = this.abrirInventario.bind(this)
  }

  componentDidMount() {
		const {usuario_coordenador_id} = this.state
		var lerDoBanco = new Promise(function(resolve, reject){
			if (usuario_coordenador_id) {
				var results = [];
				inventario_db.find({usuario_coordenador_id:parseInt(usuario_coordenador_id)},function(err, lista_inventario){	
						lista_inventario.forEach(inv => {
						var res = {id:inv.id, data:'',hora:'',status:'',tipo_inventario:inv.tipo_inventario,inventario_status:inv.inventario_status}
						agendamento_db.findOne({id:parseInt(inv.agendamento_id)}, function(err, agend){
							if(agend){
								Object.assign(res, {data: agend.data_agendamento});
								Object.assign(res, {hora: agend.hora_agendamento});
								Object.assign(res, {status: agend.agendamento_status});
							}
						}.bind(res))
						results.push(res);
					});
				}.bind(results))
					console.log(results)
					resolve(results);
				} else {
					console.log('Vazio!')
					reject(Error("It broke"));
				}
		});
		lerDoBanco.then(function(result) {
			this.setState({inventarios:result})
			console.log(this.state.inventarios); // "Stuff worked!"
		}.bind(this), function(err) {
			console.log(err); // Error: "It broke"
		});

			/*
      let connection = mysql.createConnection(env.config_mysql);
  		let query = `
  			SELECT 
  				i.id,
  				data_agendamento as 'data',
  				hora_agendamento as 'hora',
  				agendamento_status as 'status',
					i.tipo_inventario,
					inventario_status
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
			*/
  }

  abrirInventario(e, inv_id, inv_tipo, inv_status) {
    console.log('inv_id:',inv_id)
    console.log('inv_tipo:',inv_tipo)
    localStorage.setItem('inv_id', inv_id)
    localStorage.setItem('inv_tipo', inv_tipo)
		localStorage.setItem('inv_status', inv_status)
		ipcRenderer.send('set-inventario', inv_id)
    this.props.history.push('/admin/dashboard')
  }

  render() {
  	const { inventarios, usuario_coordenador_id} = this.state
    const abrir = <Tooltip id="remove_tooltip">Abrir</Tooltip>;
    return (
      <div className="content">
        <InventNavbar />
        <h1>Inventarios</h1>
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
									console.log(prop)
              		return <tr key={prop.id}>
              			<td>{prop.data} - {prop.hora}</td>
              			<td>{prop.status}</td>
              			<td>
                      <Button variant="info" size="sm" onClick={e => this.abrirInventario(e, prop.id, prop.tipo_inventario, prop.inventario_status)}>
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
