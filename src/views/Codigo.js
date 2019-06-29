import React, { Component } from "react"
import mysql from 'mysql'
import env from './../../.env'
import { 
  Container, 
  OverlayTrigger,
  Tooltip,
  Row, 
  Col, 
  Table, 
  Button,
  Form
} from "react-bootstrap";
import { Card } from "./../components/Card/Card";
export default class Codigo extends Component {
	constructor(props){
    super(props);
    this.state = {
      dep: '', setor: '', grupo: '', fam: '', subfam: '', cod_barra: '', ref: '', cod_in: '', desc: '', saldo: 0, custo: 0, venda: 0,
      base: [],
      coleta: [],
      tipo_coleta: 'INVENTARIO',
      inventario_id: localStorage.getItem('inv_id') || ''
    }
    this.handleClick = this.handleClick.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.cadastrarBase = this.cadastrarBase.bind(this)
    this.delete = this.delete.bind(this)
  }
  componentDidMount() { this.getColeta()
  }
  getColeta() {
    const {inventario_id} = this.state
    let connection = mysql.createConnection(env.config_mysql);
    let query = `
    SELECT c.* 
    FROM (select cod_barra, enderecamento, SUM(itens_embalagem) as 'qtd' from coleta where inventario_id = ? and tipo_coleta="INVENTARIO" GROUP BY cod_barra, enderecamento ) c
    LEFT OUTER JOIN (select cod_barra from base where inventario_id = ?) b
    ON  c.cod_barra = b.cod_barra
    where b.cod_barra IS NULL ORDER BY qtd DESC`
    connection.query(query, [inventario_id,inventario_id],(error, coleta, fields) => {
      if(error){
          console.log(error.code,error.fatal)
          return
      }
      this.setState({coleta})
      connection.end();
    })
  }
  cadastrarBase(e) {
    e.preventDefault();
    let {dep, setor, grupo, fam, subfam, cod_barra, ref, cod_in, desc, saldo, custo, venda, base } = this.state

    console.log(base)
    base.push({dep, setor, grupo, fam, subfam, cod_barra, ref, cod_in, desc, saldo, custo, venda})
    this.setState({base})
  }
  handleClick(e) {
    e.preventDefault();
    console.log('The link was clicked.')
    this.salvaBase()
    this.props.history.push('/admin/divergencia')
  }
  handleChange(ev) {
    const target = ev.target;
    const value = target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }
  delete(cod_barra){
    let base = this.state.base.slice();
    this.state.base.forEach((item, index) => {
      (item['cod_barra'] === cod_barra) ? base.splice(index,1) : null
    });
    this.setState({base})
  }
  salvaBase(){
    console.log(this.state.base)
    const {inventario_id} = this.state
    let values = []
    this.state.base.forEach(item => {
      values.push([
        inventario_id,
        item.dep,
        item.setor,
        item.grupo,
        item.fam,
        item.subfam,
        item.cod_barra,
        item.ref,
        item.cod_in,
        item.desc,
        item.saldo,
        item.custo,
        item.venda
      ])
    });
    console.log(values)
    let connection = mysql.createConnection(env.config_mysql);
    let query = `
    INSERT INTO 
          base (inventario_id, descricao_setor_secao, setor_secao, grupo, familia, subfamilia, cod_barra, referencia, cod_interno, descricao_item, saldo_estoque, valor_custo, valor_venda)
        VALUES ?`
    connection.query(query, [values],(error, coleta, fields) => {
      if(error){
          console.log(error.code,error.fatal)
          return
      }
      connection.end();
    })
  }
  render() {
    const remove = <Tooltip id="remove_tooltip">Remove</Tooltip>;
    const { coleta, base, dep, setor, grupo, fam, subfam, cod_barra, ref, cod_in, desc, saldo, custo, venda } = this.state
    return (
      <div className="content">
        <h1>{coleta.length}/{base.length} Códigos Novos</h1>
        <Container fluid>
        <Row>
          <Col>
            <Form  onSubmit={this.cadastrarBase}>
              <Form.Row>

<Form.Group as={Col}>
  <Form.Label>Departamento</Form.Label>
  <Form.Control name="dep" onChange={this.handleChange} value={dep}/>
</Form.Group>

<Form.Group as={Col}>
  <Form.Label>Setor</Form.Label>
  <Form.Control name="setor" onChange={this.handleChange} value={setor} />
</Form.Group>

<Form.Group as={Col}>
  <Form.Label>Grupo</Form.Label>
  <Form.Control name="grupo" onChange={this.handleChange} value={grupo} />
</Form.Group>

<Form.Group as={Col}>
  <Form.Label>Família</Form.Label>
  <Form.Control name="fam" onChange={this.handleChange} value={fam} />
</Form.Group>

<Form.Group as={Col}>
  <Form.Label>Subfamília</Form.Label>
  <Form.Control name="subfam" onChange={this.handleChange} value={subfam} />
</Form.Group>

<Form.Group as={Col}>
  <Form.Label>EAN</Form.Label>
  <Form.Control name="cod_barra" onChange={this.handleChange} value={cod_barra} />
</Form.Group>

<Form.Group as={Col}>
  <Form.Label>Referência</Form.Label>
  <Form.Control name="ref" onChange={this.handleChange} value={ref} />
</Form.Group>

<Form.Group as={Col}>
  <Form.Label>Cód.Interno</Form.Label>
  <Form.Control name="cod_in" onChange={this.handleChange} value={cod_in} />
</Form.Group>

<Form.Group as={Col}>
  <Form.Label>Descrição</Form.Label>
  <Form.Control name="desc" onChange={this.handleChange} value={desc} />
</Form.Group>

<Form.Group as={Col}>
  <Form.Label>Saldo</Form.Label>
  <Form.Control type="number" name="saldo" onChange={this.handleChange} value={saldo} />
</Form.Group>

<Form.Group as={Col}>
  <Form.Label>Custo</Form.Label>
  <Form.Control name="custo" onChange={this.handleChange} value={custo} />
</Form.Group>

<Form.Group as={Col}>
  <Form.Label>Venda</Form.Label>
  <Form.Control name="venda" onChange={this.handleChange} value={venda} />
</Form.Group>
              </Form.Row>
              
              <Button variant="info" type="submit">
                Cadastrar
              </Button>
              <div className="p-2"/>
            </Form>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Card 
              title="INVENTÁRIO "
              ctTableFullWidth
              ctTableResponsive
              content={ <div style={{
                overflow: 'auto',
                height: '200px'
            }}>
                <Table striped>
                  <thead>
                    <tr>
                      <th>EAN</th>
                      <th>ENDERECAMENTO</th>
                      <th>QUANT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coleta.map((prop,key) => {
                      return (
                        <tr key={key}>
                          <td>{prop.cod_barra}</td>
                          <td>{prop.enderecamento}</td>
                          <td>{prop.qtd}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table></div>
              }
            />
          </Col>
          <Col md={6}>
            <Card
              title="ESTOQUE"
              ctTableFullWidth
              ctTableResponsive
              content={<div style={{
                overflow: 'auto',
                height: '200px'
            }}>
                <Table striped >
                  <thead>
                    <tr>
                      <th>EAN</th>
                      <th>SALDO</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {base.map((prop,key) => {
                      return (
                        <tr key={prop.cod_barra}>
                          <td>{prop.cod_barra}</td>
                          <td>{prop.saldo}</td>
                          <td>
                            <OverlayTrigger overlay={remove}>
                              <button onClick={() => this.delete(prop.cod_barra)} className = "text-light bg-danger rounded">
                                x
                              </button>
                            </OverlayTrigger>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table></div>
              }
            />
          </Col>
        </Row>
      

        <div>
          {/* <div className="p-2"/> */}
          <div className="">
            <Button variant="info" onClick={this.handleClick}>Salvar</Button>
          </div>
        </div>
      </Container>
      </div>
    );
  }
}