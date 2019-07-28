import React, { Component } from "react"
import mysql from 'mysql'
import env from '../../../.env'
import nedb from 'nedb'
import { 
  Container,
  Row, 
  Col, 
  Button,
  Form
} from "react-bootstrap";
import readXlsxFile from 'read-excel-file/node';
const { ipcRenderer } = window.require('electron')

const base_db = new nedb({filename: 'data/base.json'})
const coleta_db = new nedb({filename: 'data/coleta.json'})

export default class Codigo extends Component {
	constructor(props){
    super(props);
    this.state = {
      base: [],
      coleta: [],
      inventario_id: localStorage.getItem('inv_id') || '',
      file: null
    }
  }
  componentDidMount() { 
    const { inventario_id } = this.state
    this.getColeta()
    // base_db.find({inventario_id: Number(inventario_id)}, {cod_barra: 1, _id:0},(err,docs)=>{
    //   if (err) {
    //     alert(`Erro ao ler a base, código: ${err}`)
    //   } else{
    //     console.log(docs)
    //   }
    // })
    // coleta_db.find({inventario_id: Number(inventario_id)}, {cod_barra: 1, enderecamento: 1, itens_embalagem: 1, _id: 0},(err,doc)=>console.table(doc))
  }
  onFormSubmit(e){
    e.preventDefault() // Stop form submit
    const {inventario_id, file} = this.state;
    if(file !== null) {
      readXlsxFile(file.path).then((rows) => {
        let base = rows.slice(1).map( element =>
          ({
                'cod_barras': element[0],
                'cod_interno': element[1],
                'departamento': element[2],
                'setor_secao': element[3],
                'departamento': element[4],
                'grupo': element[5],
                'familia': element[6],
                'subfamilia': element[7],
                'referencia': element[8],
                'saldo_qtd_estoque': element[9],
                'valor_custo': element[10],
                'valor_venda': element[11],
                'descricao_item': element[12],
                'inventario': Number(inventario_id)
              })
        )
        this.setState({base})
      })
    }
  }
  onChange(e) {
    this.setState({file:e.target.files[0]})
  }
  getColeta() {
    // console.log(ipcRenderer.sendSync('synchronous-message', 'ping')) // prints "pong"
    const {inventario_id} = this.state
    let connection = mysql.createConnection(env.config_mysql);
    let query = `
    SELECT c.* 
    FROM (
      select cod_barra, enderecamento, SUM(itens_embalagem) as 'qtd' 
      from coleta 
      where inventario_id = ? and tipo_coleta="INVENTARIO" 
      GROUP BY cod_barra, enderecamento 
      ) c
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
  handleClick() {
    const { base } = this.state
    if (base.length) {
      alert('Base enviada para o processo principal')
      ipcRenderer.send('insert-base', base)
    } else {
      alert('Base vazia')
    }
    alert('Ir para divergência')
    this.props.history.push('/admin/divergencia')
  }
  render() {
    const options = {
      defaultSortName: 'valor_divergente', 
      noDataText: 'Não há dados para exibir',
      exportCSVText: 'Exportar para csv'
    }
    const { coleta, base } = this.state
    return (
      <div className="content">
        <h1>Códigos Novos</h1>
        <Container fluid>
        <Row>
          <Col>
            <Form onSubmit={this.onFormSubmit.bind(this)}>
              <Form.Label>Carregar arquivo</Form.Label>
              <Form.Control size="sm" type="file" onChange={this.onChange.bind(this)} />
              <div className="p-2"/>
              <Button  variant="info" type="submit">Carregar</Button>
              <div className="p-2"/>
            </Form>
          </Col>
        </Row>
        <Row>
          <Col md={6} style={{ 'marginBottom': '30px' }}>
            <BootstrapTable data={coleta} height='250' scrollTop={ 'Bottom' } 
              search exportCSV options={ options }>
              <TableHeaderColumn dataField='cod_barra' isKey>EAN COLETA ({coleta.length})</TableHeaderColumn>
              <TableHeaderColumn dataField='enderecamento'>ENDERECAMENTO</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd'>QUANT</TableHeaderColumn>
            </BootstrapTable>
          </Col>
          <Col md={6} style={{ 'marginBottom': '30px' }}>
            <BootstrapTable data={base} height='250' scrollTop={ 'Bottom' } 
              search options={ options }>
              <TableHeaderColumn dataField='cod_barras' width='140' isKey >EAN BASE ({base.length})</TableHeaderColumn>
              <TableHeaderColumn dataField='descricao_item' tdStyle={{whiteSpace: 'normal'}}>DESCRIÇÃO</TableHeaderColumn>
              <TableHeaderColumn dataField='saldo_qtd_estoque' width='70'>SALDO</TableHeaderColumn>
            </BootstrapTable>
          </Col>
        </Row>
        <div>
          <Button variant="info" onClick={this.handleClick.bind(this)}>Salvar</Button>
          <div className="p-2"/>
        </div>
      </Container>
      </div>
    );
  }
}