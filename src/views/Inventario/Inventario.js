import React, { Component } from "react";
const { ipcRenderer } = window.require('electron')
import nedb from 'nedb'
var inventario_db = new nedb({filename: 'data/inventario.json', autoload: true})
var agendamento_db = new nedb({filename: 'data/agendamento.json', autoload: true})

import InventNavbar from "../../components/Navbars/InventNavBar"
import {
	Container,
	Table,
	Tooltip,
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
		if (usuario_coordenador_id) {
				var results = [];
				new Promise(function( resolve, reject ){
					inventario_db.find({usuario_coordenador_id:parseInt(usuario_coordenador_id)},function(err, lista_inventario){	
						if(lista_inventario){
							resolve(lista_inventario);
						}
						else reject('inventario nao encontrado');
				})
				}).then(lista_inventario => {
					lista_inventario.forEach(invent => {
					new Promise(function( resolve, reject ){
							agendamento_db.findOne({id: parseInt(invent.agendamento_id)}, function(err, agend){
								if(agend){
									invent.data = agend.data_agendamento;
									invent.hora = agend.hora_agendamento;
									invent.status = agend.agendamento_status;
									resolve(lista_inventario)
								} else reject('agendamento nao encontrado ')
							}.bind(invent))
					}).then(() => {
						this.setState({inventarios:lista_inventario})
					})					
					});
				})
				
			}
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
  	const { inventarios} = this.state
    return (
      <div className="content">
        <InventNavbar />
        <h1>Inventarios</h1>
        	<Container fluid>
        		<Table striped size="sm" responsive>
              <thead>
              	<tr>
              		<th>ID</th>
									<th>Tipo</th>
              		<th>Data e Hora</th>
              		<th>Status</th>
              		<th>Ação</th>
                </tr>
              </thead>
              <tbody>
              	{inventarios.map(prop=>{
              		return <tr key={prop.id}>
              			<td>{prop.id}</td>
										<td>{prop.tipo_inventario}</td>
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
