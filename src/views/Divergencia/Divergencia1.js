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

class Divergencia1 extends Component {
	constructor(props){
    super(props);
    this.state = {
    	divergencia: [],
      inventario_id: localStorage.getItem('inv_id') || ''
    }

    this.handleChange = this.handleChange.bind(this);
    this.auditar = this.auditar.bind(this);
  }
  componentDidMount() {
    const {inventario_id} = this.state
    console.log('DivergenciaPage, inventario_id:', inventario_id)
    if (inventario_id) {
      let connection = mysql.createConnection(env.config_mysql);
    	let query = `
    		SELECT b.cod, b.qtd - c.qtd AS 'divergencia', false AS 'auditar'
  			FROM 
  				(SELECT cod_barra AS 'cod', COUNT(cod_barra) AS 'qtd' 
  				FROM base WHERE inventario_id=?
  				GROUP BY cod_barra) b,
  				(SELECT cod_barra AS 'cod', COUNT(cod_barra) AS 'qtd' 
  				FROM coleta 
  				GROUP BY cod_barra) c 
  			WHERE b.cod=c.cod
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
  handleChange(ev, key) {
    const target = ev.target
    const checked = target.checked
    const divergencia = this.state.divergencia.slice()
    divergencia[key].auditar = checked? 1 : 0
    this.setState({divergencia})
  }
  auditar() {
    let texto = 'Auditar selecionados:\n'
    let div = []
    this.state.divergencia.map(p=>{
      if (p.auditar) {
        texto = texto +' - ' + p.cod + '\n'
        div.push({cod_barra: p.cod, qtd: p.divergencia})
      }
    })
    if (div.length) {
      console.log(div)
      alert(texto)
      localStorage.setItem('div2', JSON.stringify(div))
      console.log(localStorage.getItem('div1') || [])
      this.props.history.push('/audit2/dashboard')
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
            <Col md={12}>
          		<Table striped size="sm" responsive>
                <thead>
                	<tr>
                		<th>Código</th>
                		<th>Divergencia</th>
                		<th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                	{divergencia.map((prop,key)=>{
                		return <tr key={key}>
                			<td>{prop.cod}</td>
                			<td>{prop.divergencia}</td>
    		        			<td>
    		        				<Form.Check 
    			        				checked={prop.auditar}
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

export default Divergencia1;