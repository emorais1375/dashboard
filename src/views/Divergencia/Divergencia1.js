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
      checkAll: false,
    	divergencia: [],
      organizar_por: 'Valor',
      inventario_id: localStorage.getItem('inv_id') || '',
      base: JSON.parse(localStorage.getItem('div1')) || []
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
    if (inventario_id) {
      let connection = mysql.createConnection(env.config_mysql);
      let query = `
        select *, qtd_inventario-saldo_estoque qtd_divergencia, 'NAO' auditar,
        TRUNCATE(IF((qtd_inventario-saldo_estoque)*valor_custo<0,(qtd_inventario-saldo_estoque)*valor_custo*-1,(qtd_inventario-saldo_estoque)*valor_custo),2) valor_divergente
        from (
          select base_id, COALESCE(t1.cod_barra,t2.cod_barra) cod_barra, qtd_inventario, saldo_estoque, valor_custo
          from 
            (select base_id, cod_barra, saldo_estoque, valor_custo
            from divergencia where inventario_id=? AND auditar='SIM'
            GROUP BY base_id, cod_barra, saldo_estoque, valor_custo) t1,
            (select cod_barra, SUM(itens_embalagem) qtd_inventario  
            from coleta where inventario_id=? AND tipo_coleta='AUDITORIA1' 
            GROUP BY cod_barra) t2
          WHERE t1.cod_barra = t2.cod_barra) t
        HAVING qtd_divergencia !=0
        ORDER BY `+ ordem +`
      `
      connection.query(query, [inventario_id, inventario_id],(error, divergencia, fields) => {
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
      console.log(divergencia[i].auditar)
    }
    return divergencia
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
    //         auditar = ?,
    //         auditar_externo = ?
    //     WHERE 
    //         base_id = ?
    // `

    // connection.query(query, [auditar, auditar, base_id], (error, results, fields) => {
    //   if(error){
    //     console.log(error.code,error.fatal)
    //     return
    //   }
      divergencia[key].auditar = auditar
      this.setState({divergencia})
      this.setState({checkAll: false})
    //   connection.end()
    // })
  }
  handleChange2(e) {
    const organizar_por = e.target.value
    this.setState({organizar_por}, ()=>this.gerarDivergencia())
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
          p.auditar,
          p.base_id
        )
        query = query + "UPDATE divergencia SET auditar = ?, auditar_externo = ? WHERE base_id = ?"
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
    if (div.length) {
      console.log(div)
      alert(texto)
      localStorage.setItem('div2', JSON.stringify(div))
      console.log(localStorage.getItem('div2') || [])
      this.props.history.push('/audit2/dashboard')
    } else {
      alert('Não foram selecionados itens para serem auditados.')
      console.log('Vazio!')
    }
  }
  render() {
  	const { divergencia, checkAll } = this.state
    return (
      <div className="content">
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

export default Divergencia1;
