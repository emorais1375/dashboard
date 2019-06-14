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
      checkAll: false,
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
  
  handleChangeCheckAll(ev){
    const check = ev.target.checked?true:false
    this.setState({checkAll:check})
    const divergencia = this.state.divergencia.slice()
    
    this.setState({divergencia:this.getChangedDivergencia(divergencia, check)})
    
  }
  
  getChangedDivergencia(divergencia, check){
    const auditar = check ? 'SIM' : 'NAO'
    for(var i=0; i<divergencia.length; i++){
      divergencia[i].auditar = auditar
    }
    return divergencia
  }

  handleChange(ev, key) {
    const target = ev.target
    const checked = target.checked
    const divergencia = this.state.divergencia.slice()
    const auditar = checked ? 'SIM' : 'NAO'
    divergencia[key].auditar = auditar
    this.setState({divergencia})
    this.setState({checkAll: false})
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
    new Promise((resolve, reject) => {
      this.state.divergencia.map(p=>{
        if (p.auditar==='SIM') {
          texto = texto +' - ' + p.cod_barra + '\n'
          div.push({base_id: p.base_id, cod_barra: p.cod_barra, qtd: p.saldo_estoque})
          values.push(
            p.auditar,
            p.base_id
          )
          query = query + "UPDATE divergencia SET auditar = ? WHERE base_id = ?;"
        }
      })
      resolve()
    })
    .then(() => {
      let connection = mysql.createConnection(env.config_mysql)
      connection.query(query, values, (error, results, fields) => {
        if(error){
          console.log(error.code,error.fatal)
          return
        }
        console.log('Update divergencia')
        connection.end()
        return
      })
    })
    .then(() => {
      if (values.length) {
        alert(texto)
        localStorage.setItem('div1', JSON.stringify(div))
        this.props.history.push('/audit1/dashboard')
      } else {
        alert('Não foram selecionados itens para serem auditados.')
        console.log('Vazio!')
      }
    })
  }
  render() {
  	const { divergencia, checkAll } = this.state
    return (
      <div className="content">
        <div>
        <div className="d-inline p-2"><Download /></div>
        <div className="d-inline p-2">
          <ExcelFile filename="Relatorios" element={<Button variant="info" onClick={this.auditar}>Baixar Divergencia</Button>}>
          <ExcelSheet name="Divergencia" data={divergencia}>
            <ExcelColumn label="EAN" value="cod_barra"/>
            <ExcelColumn label="Saldo" value="saldo_estoque"/>
            <ExcelColumn label="Quantidade" value="qtd_divergencia"/>
            <ExcelColumn label="Valor" value="valor_divergente"/>
          </ExcelSheet>
        </ExcelFile>
        </div>
        </div>
        <h1>Divergencia</h1>
        <Container fluid>
          <Row>
            <Col lg={4} md={4} sm={4}>
              <Button variant="info" onClick={this.auditar}>
                Auditoria
              </Button>
            </Col>
            <Col lg={5} md={4} sm={4}></Col>
            <Col lg={3} md={4} sm={4}>
              <Form.Group as={Col} controlId="formGridState">
                <Form.Label>Organizar por:{checkAll}</Form.Label>
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
                		<th>
                        <Form.Check
                          label="Auditoria"
                          onChange={e => this.handleChangeCheckAll(e)}
                          checked = {checkAll}
    		        				/>
                    </th>
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
                          checked={prop.auditar==='SIM'?true:checkAll?true:false}
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
