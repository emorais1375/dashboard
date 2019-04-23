import React, { Component } from "react";
import mysql from 'mysql';
import env from '../../../.env'
import {
	Container,
	Table,
	Form,
	Button,
  Row,
  Col
} from "react-bootstrap"

class Divergencia extends Component {
	constructor(props){
    super(props);
    this.state = {
    	divergencia: [],
      organizar_por: 'Valor',
      inventario_id: localStorage.getItem('inv_id') || ''
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleChange2 = this.handleChange2.bind(this);
    this.auditar = this.auditar.bind(this);
  }
  componentDidMount() {
    this.gerarDivergencia()
  }
  gerarDivergencia(){
    const {inventario_id, organizar_por} = this.state
    let ordem = "c_qtd ASC"
    switch (organizar_por) {
      case "Valor":
          ordem = 'valor_divergente ASC'
        break;
      case "Quantidade":
          ordem = "qtd_divergencia ASC"
        break;
    }
    console.log('1˚ Divergencia do inventário ', inventario_id, ordem, organizar_por)
    if (inventario_id) {
      let connection = mysql.createConnection(env.config_mysql);
      let query = `
        SELECT id, enderecamento, cod_barra, 
          qtd_inventario, qtd_divergencia, valor_divergente, auditar 
        FROM divergencia 
        WHERE inventario_id=? AND auditar != 'NAO PODE' 
        ORDER BY `+ ordem +`
      `
      connection.query(query, [inventario_id],(error, divergencia, fields) => {
        if(error){
            console.log(error.code,error.fatal)
            return
        }
        this.setState({divergencia})
        connection.end();
      })
    } else {
      console.log('Vazio!')
    }
  }
  salvarDivergencia(){

  }
  handleChange(ev, key) {
    const target = ev.target
    const checked = target.checked
    const divergencia = this.state.divergencia.slice()
    const id = divergencia[key].id
    const auditar = checked ? 'SIM' : 'NAO'
    let connection = mysql.createConnection(env.config_mysql)
    const query = `
        UPDATE 
            divergencia
        SET 
            auditar = ?
        WHERE 
            id = ?
    `

    connection.query(query, [auditar, id], (error, results, fields) => {
      if(error){
        console.log(error.code,error.fatal)
        return
      }
      divergencia[key].auditar = auditar
      this.setState({divergencia})
      connection.end()
    })
  }
  handleChange2(e) {
    const value = e.target.value
    this.setState({organizar_por: value}, ()=>this.gerarDivergencia())
  }
  auditar() {
		let texto = 'Auditar selecionados:\n'
    let div = []
    this.state.divergencia.map(p=>{
    	if (p.auditar==='SIM') {
    		texto = texto +' - ' + p.cod_barra + '\n'
        div.push({cod_barra: p.cod_barra, qtd: p.qtd_divergencia})
    	}
    })
    if (div.length) {
      console.log(div)
      alert(texto)
      localStorage.setItem('div1', JSON.stringify(div))
      console.log(localStorage.getItem('div1') || [])
      // this.props.history.push('/audit1/dashboard')
    } else {
      alert('Não foram selecionados itens para serem auditados.')
      console.log('Vazio!')
    }
  }
  render() {
  	const { divergencia } = this.state
    return (
      <div className="content">
        <h1>Divergencia</h1>
        <Container fluid>
          <Row>
            <Col lg={4} md={6}>
              <Button variant="info" onClick={this.auditar}>
                Auditoria
              </Button>
            </Col>
            <Col>
              <Form.Group as={Col} controlId="formGridState">
                <Form.Label>Organizar por:</Form.Label>
                <Form.Control as="select"  
                  onChange={this.handleChange2} 
                  value={this.state.organizar_por}>
                    <option>Valor</option>
                    <option>Quantidade</option>
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
          		<Table striped size="sm" responsive>
                <thead>
                	<tr>
                    <th>Enderecamento</th>
                    <th>EAN</th>
                    <th>Inventário</th>
                    <th>Quantidade</th>
                    <th>Valor</th>
                		<th>Auditoria</th>
                  </tr>
                </thead>
                <tbody>
                	{divergencia.map((prop,key)=>{
                		return <tr key={prop.id}>
                      <td>{prop.enderecamento}</td>
                      <td>{prop.cod_barra}</td>
                      <td>{prop.qtd_inventario}</td>
                      <td>{prop.qtd_divergencia}</td>
                      <td>{prop.valor_divergente}</td>
    		        			<td>
    		        				<Form.Check 
    			        				checked={prop.auditar==='SIM'?true:false}
    	                    onChange={e => this.handleChange(e, key)}
    		        				/>
    		        			</td>
                		</tr>
                	})}
                </tbody>
              </Table>
            </Col>
          </Row>
      	</Container>      
      </div>
    );
  }
}

export default Divergencia;
