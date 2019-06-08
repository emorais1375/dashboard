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
import Download from '../../components/Download'
import ReactExport from "react-data-export"

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

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
    let ordem = "qtd_divergencia ASC"
    switch (organizar_por) {
      case "Valor":
          ordem = 'valor_divergente DESC'
        break;
      case "Quantidade":
          ordem = "qtd_divergencia ASC"
        break;
    }
    console.log('1˚ Divergencia do inventário ', inventario_id, ordem, organizar_por)
    if (inventario_id) {
      let connection = mysql.createConnection(env.config_mysql);
      let query = `
        SELECT base_id, cod_barra, saldo_estoque, (SUM(qtd_inventario)-saldo_estoque) qtd_divergencia, 
        TRUNCATE(IF((SUM(qtd_inventario)-saldo_estoque)*valor_custo<0,(SUM(qtd_inventario)-saldo_estoque)*valor_custo*-1,(SUM(qtd_inventario)-saldo_estoque)*valor_custo),2) valor_divergente, auditar 
        FROM divergencia 
        WHERE inventario_id=? AND auditar != 'NAO PODE' 
        GROUP BY cod_barra, saldo_estoque, valor_custo, auditar, base_id
        HAVING qtd_divergencia !=0
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
  handleChange(ev, key) {
    const target = ev.target
    const checked = target.checked
    const divergencia = this.state.divergencia.slice()
    // const base_id = divergencia[key].base_id
    const auditar = checked ? 'SIM' : 'NAO'
    // let connection = mysql.createConnection(env.config_mysql)
    // const query = `
    //     UPDATE 
    //         divergencia
    //     SET 
    //         auditar = ?
    //     WHERE 
    //         base_id = ?
    // `

    // connection.query(query, [auditar, base_id], (error, results, fields) => {
    //   if(error){
    //     console.log(error.code,error.fatal)
    //     return
    //   }
      divergencia[key].auditar = auditar
      this.setState({divergencia})
      // connection.end()
    // })
  }
  handleChange2(e) {
    const value = e.target.value
    this.setState({organizar_por: value}, ()=>this.gerarDivergencia())
  }
  auditar() {
		let texto = 'Auditar selecionados:\n'
    let div = []
    let values = []
    let query = ""
    this.state.divergencia.map(p=>{
    	if (p.auditar==='SIM') {
    		texto = texto +' - ' + p.cod_barra + '\n'
        div.push({base_id: p.base_id, cod_barra: p.cod_barra, qtd: p.saldo_estoque})
        values.push(
          p.auditar,
          p.base_id
        )
        query = query + "UPDATE divergencia SET auditar = ? WHERE base_id = ?"
    	}
    })
    let connection = mysql.createConnection(env.config_mysql)
    connection.query(query, values, (error, results, fields) => {
      if(error){
        console.log(error.code,error.fatal)
        return
      }
      connection.end()
    })
    if (values.length) {
      console.log(div)
      alert(texto)
      localStorage.setItem('div1', JSON.stringify(div))
      console.log(localStorage.getItem('div1') || [])
      this.props.history.push('/audit1/dashboard')
    } else {
      alert('Não foram selecionados itens para serem auditados.')
      console.log('Vazio!')
    }
  }
  render() {
  	const { divergencia } = this.state
    return (
      <div className="content">
        <Download />
        <ExcelFile filename="Relatorios" element={<button>Baixar Divergencia</button>}>
          <ExcelSheet name="Divergencia" data={divergencia}>
            <ExcelColumn label="EAN" value="cod_barra"/>
            <ExcelColumn label="Saldo" value="saldo_estoque"/>
            <ExcelColumn label="Quantidade" value="qtd_divergencia"/>
            <ExcelColumn label="Valor" value="valor_divergente"/>
          </ExcelSheet>
        </ExcelFile>
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
                    <th>EAN</th>
                    <th>Quantidade</th>
                    <th>Valor</th>
                		<th>Auditoria</th>
                  </tr>
                </thead>
                <tbody>
                	{divergencia.map((prop,key)=>{
                		return <tr key={prop.base_id}>
                      <td>{prop.cod_barra}</td>
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
