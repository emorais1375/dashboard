import React, { Component } from "react";
import mysql from 'mysql';
import env from '../../../.env'
import nedb from 'nedb'
import {
	Container,
	Table,
	Form,
	Button,
  Row,
  Col,
  Modal
} from "react-bootstrap"
import readXlsxFile from 'read-excel-file/node';
import Download from '../../components/Download'
import NaoContados from "../../components/NaoContados";
import ReactExport from "react-data-export";
import { promises } from "fs";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;



import { BootstrapTable, TableHeaderColumn}  from 'react-bootstrap-table'
import { ipcRenderer } from "electron";

function jobStatusValidator(value) {
  const nan = isNaN(parseInt(Number(value), 10));
  if (nan) {
    return 'O saldo deve ser um inteiro!';
  }
  return true;
}

class Divergencia extends Component {
	constructor(props){
    super(props);
    this.state = {
      showModal: false,
      cod_barra: '', desc: '', saldo: 0,
      checkAll: false,
      divergencia: [],
      divergencia2: [],
      selected: [],
      base: [],
      coleta: [],
      organizar_por: 'Valor',
      tipo_coleta: 'INVENTARIO',
      // inventario_id: localStorage.getItem('inv_id') || '',
      inventario_id: 17,
      file: null
    }

    this.onSelectAll = this.onSelectAll.bind(this);
    this.onRowSelect = this.onRowSelect.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleChange2 = this.handleChange2.bind(this);
    this.handleChange3 = this.handleChange3.bind(this);
    this.atualizaLista = this.atualizaLista.bind(this)
    this.auditar = this.auditar.bind(this)
    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }
  componentDidMount() {
    // const thisDb = ipcRenderer.sendSync('getBase', 'base')
    // console.log('base: ',thisDb)
    // const thisDb2 = ipcRenderer.sendSync('getColeta', 'coleta')
    // console.log('coleta: ',thisDb2)
    this.gerarDivergencia()
    this.getBase().then(()=>{
      this.getColeta().then(()=>{
        this.createDivergencia()
      },(code, fatal)=>{
        alert('Erro ao ler a coleta: '+code+fatal)
      })
    },(code, fatal)=>{
      alert('Erro ao ler a base: '+code+fatal)
    })
  }
  onFormSubmit(e){
    e.preventDefault() // Stop form submit
    const {inventario_id, file} = this.state;
    const base_db = new nedb({filename: 'data/base.json', autoload: true})
    let cout_err = 0
    if(file !== null) {
      readXlsxFile(file.path).then((rows) => {
        Promise.resolve(
          rows.slice(1).forEach( element =>
            {
              base_db.update({
                'cod_barra': element[0].toString(),
                'inventario_id': Number(inventario_id)
              }, { $set: { saldo_estoque : Number(element[1]) } }, {multi: false}, (err)=>{
                if (err) {
                  cout_err++;
                  console.log(err)
                }
                console.log(`${element[0].toString()} inserido`)
              })
            }
          )
        ).then(() => {
          if (cout_err) {
            alert('Erro ao atualizar saldo da base')
          } else{
            alert('Saldo da base atualizado')
          }
          console.log(rows)
          base_db.find({},console.log)
        })
      })
    }
  }
  onChange(e) {
    this.setState({file:e.target.files[0]})
  }
  getBase(){
    return new Promise((resolve, reject)=>{
      const base = ipcRenderer.sendSync('getBase', 'base')
      this.setState({base})
      resolve()
      // const base_db = new nedb({filename: 'data/base.json'})
      // let _this = this
      // const { inventario_id } = this.state
      // base_db.loadDatabase(err => {
      //   base_db.find({inventario_id: Number(inventario_id)}, (err, base) => {
      //     if (err) {
      //       alert(`Erro ao ler a base, cod: ${err}`)
      //       reject(err)
      //     } else {
      //       console.log(base)
      //       _this.setState({base})
      //       resolve()
      //     }
      //   })

      // })
    })
    // let connection = mysql.createConnection(env.config_mysql);
    // let query = 'select * from base where inventario_id = ?'
    // return new Promise((resolve, reject)=>{
    //   connection.query(query, [this.state.inventario_id],(error, base, fields) => {
    //     if(error){
    //         console.log(error.code,error.fatal)
    //         reject(error.code,error.fatal)
    //         return 0
    //     }
    //     this.setState({base})
    //     connection.end();
        // resolve()
    //   })
    // })
  }
  getColeta(){
    const { inventario_id, tipo_coleta } = this.state
    let connection = mysql.createConnection(env.config_mysql);
    let query = `
      SELECT
        cod_barra, SUM(itens_embalagem) qtd_inventario,
        GROUP_CONCAT(DISTINCT enderecamento) enderecamento
      FROM coleta  where inventario_id = ? and tipo_coleta = ?
      GROUP BY cod_barra `
    return new Promise((resolve, reject)=>{
      const coleta = ipcRenderer.sendSync('getColeta', 'coleta')
      this.setState({coleta})
      resolve()


      // connection.query(query, [inventario_id, tipo_coleta],(error, coleta, fields) => {
      //   if(error){
      //       console.log(error.code,error.fatal)
      //       reject(error.code,error.fatal)
      //       return 0
      //   }
      //   this.setState({coleta})
      //   connection.end();
      //   resolve()
      // })
    })
  }
  createDivergencia(){
    const { base, coleta } = this.state
    let divergencia2 = []
    base.map(b =>{
      let div = {
        cod_barra: b['cod_barra'],
        cod_interno: b['cod_interno'],
        descricao_item: b['descricao_item'],
        descricao_setor_secao: b['descricao_setor_secao'],
        familia: b['familia'],
        grupo: b['grupo'],
        base_id: b['id'],
        inventario_id: b['inventario_id'],
        referencia: b['referencia'],
        saldo_estoque: b['saldo_estoque'],
        setor_secao: b['setor_secao'],
        subfamilia: b['subfamilia'],
        valor_custo: b['valor_custo'],
        valor_venda: b['valor_venda'],
        enderecamento: 'desconhecido',
        qtd_inventario: 0,
        qtd_divergencia: 0 - b['saldo_estoque'],
        valor_divergente: Number(((0 - b['saldo_estoque'])*b['valor_custo']).toFixed(2))
      }
      let element = coleta.find(c => {
        return b['cod_barra'] === c['cod_barra']
      })
      if (element) {
        div['enderecamento'] = element['enderecamento'],
        div['qtd_inventario'] = element['qtd_inventario'],
        div['qtd_divergencia'] = element['qtd_inventario'] - b['saldo_estoque'],
        div['valor_divergente'] = Number(((element['qtd_inventario'] - b['saldo_estoque'])*b['valor_custo']).toFixed(2))
        if(div['qtd_divergencia'] !== 0) divergencia2.push(div)
      } else {
        if(div['qtd_divergencia'] !== 0) divergencia2.push(div)
      }
      // coleta.map(c => {
      //   if (b['cod_barra'] === c['cod_barra']) {
      //     divergencia2.push({
      //       cod_barra: b['cod_barra'],
      //       cod_interno: b['cod_interno'],
      //       descricao_item: b['descricao_item'],
      //       descricao_setor_secao: b['descricao_setor_secao'],
      //       familia: b['familia'],
      //       grupo: b['grupo'],
      //       base_id: b['id'],
      //       inventario_id: b['inventario_id'],
      //       referencia: b['referencia'],
      //       saldo_estoque: b['saldo_estoque'],
      //       setor_secao: b['setor_secao'],
      //       subfamilia: b['subfamilia'],
      //       valor_custo: b['valor_custo'],
      //       valor_venda: b['valor_venda'],
      //       enderecamento: c['enderecamento'],
      //       qtd_inventario: c['qtd_inventario'],
      //       qtd_divergencia: c['qtd_inventario'] - b['saldo_estoque'],
      //       valor_divergente: ((c['qtd_inventario'] - b['saldo_estoque'])*b['valor_custo']).toFixed(2)
      //     })
      //   }
      // })
    })
    this.setState({divergencia2})
    // console.table(divergencia2)
  }
  gerarDivergencia(){
    const {inventario_id, organizar_por} = this.state
    let ordem = "qtd_divergencia ASC"
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
        SELECT base_id, cod_barra, descricao_item, saldo_estoque, valor_custo, SUM(qtd_inventario) as qtd_inventario, (SUM(qtd_inventario)-saldo_estoque) qtd_divergencia, 
        TRUNCATE(
          IF(
            (SUM(qtd_inventario)-saldo_estoque)*valor_custo<0,
            (SUM(qtd_inventario)-saldo_estoque)*valor_custo*1,
            (SUM(qtd_inventario)-saldo_estoque)*valor_custo
          ),2
        ) valor_divergente, auditar 
        FROM divergencia 
        WHERE inventario_id=? AND auditar != 'NAO PODE' 
        GROUP BY cod_barra, descricao_item, saldo_estoque, valor_custo, auditar, base_id
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
  handleChange3(ev) {
    const target = ev.target;
    const value = target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }
  auditar2(){
    const { selected, divergencia2 } = this.state
    let div = []
    div = selected.map(s => {
      return divergencia2.find(d => {
        if(d.base_id === s) {
          let enderecamento = d.enderecamento.split(',')
          enderecamento.map(e=>{
            values.push('SIM', e, s)
            query = query + "UPDATE divergencia SET auditar = ?, enderecamento = ? WHERE base_id = ?;"
          })
          return true
        }
        return false
      })
    })
    console.table(div)
  }
  auditar() {
    let div = []
    let values = []
    let query = ""
    const { selected, divergencia2 } = this.state
    new Promise((resolve, reject) => {
      div = selected.map(s => {
        return divergencia2.find(d => {
          if(d.base_id === s) {
            let enderecamento = d.enderecamento.split(',')
              enderecamento.map(e=>{
                values.push('SIM', e, s)
                query = query + "UPDATE divergencia SET auditar = ?, enderecamento = ? WHERE base_id = ?;"
            })
            return true
          }
          return false
        })
      })
      console.table(div)
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
      if (div.length) {
        localStorage.setItem('div1', JSON.stringify(div))
        localStorage.setItem('rl_1', JSON.stringify(divergencia2))
        this.props.history.push('/audit1/dashboard')
      } else {
        alert('Não foram selecionados itens para serem auditados.')
      }
    })
  }
  auditarOld() {
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
  handleClose() {
    this.setState({ showModal: false });
  }
  handleShow(ev, prop) {
    this.setState({ 
      showModal: true, 
      cod_barra: prop.cod_barra,
      desc: prop.descricao_item,
      saldo: prop.saldo_estoque
    });
  }
  atualizaLista(e){
    e.preventDefault()
    let divergencia = this.state.divergencia.slice();
    const { cod_barra, saldo } = this.state
    this.state.divergencia.forEach((item, index) => {
      if(item['cod_barra'] === cod_barra){
        divergencia[index].saldo_estoque = parseInt(saldo)
        divergencia[index].cod_barra = cod_barra
        divergencia[index].qtd_divergencia = divergencia[index].qtd_inventario - divergencia[index].saldo_estoque
        divergencia[index].valor_divergente = (divergencia[index].qtd_divergencia*divergencia[index].valor_custo).toFixed(2)
      }
    });
    this.setState({divergencia})
    this.handleClose()
  }
  atualizaBase(){
    let values = []
    let query = ""
    this.state.divergencia2.forEach(item => {
      values.push(
        item.saldo_estoque,
        item.base_id
      )
      query = query + "UPDATE base SET saldo_estoque = ? WHERE id = ?;"
    })
    let connection = mysql.createConnection(env.config_mysql);
    connection.query(query, values, (error, results, fields)=>{
      if(error) {
        console.log(error.code,error.fatal)
        alert('Ocorreu um erro '+error.code)
        return
      }
      alert('Base foi atualizada consucesso!')
      connection.end()
    })
  }
  getListaChecados(e){
    let dataSet = []
    this.state.divergencia.map((item) => {
      if (item['auditar'] === "SIM"){
        dataSet.push(item)
      }
    })
    console.log(dataSet)
    return dataSet

  }
  onRowSelect({ base_id, qtd_divergencia, enderecamento }, isSelected) {
    if (isSelected && (qtd_divergencia === 0 || enderecamento === 'desconhecido')) {
      alert('O item não deu divergência ou não tem endereçamento');
    } else if (isSelected && (qtd_divergencia !== 0 || enderecamento !== 'desconhecido')){
      this.setState({
        selected: [ ...this.state.selected, base_id ].sort()
      });
    } else {
      this.setState({ selected: this.state.selected.filter(it => it !== base_id) })
    }
    return false;
  }
  onSelectAll(isSelected){
    if (isSelected) {
      alert('Marcar apenas itens com divergência e com endereçamento');
      this.setState({ selected: this.state.divergencia2.filter(d => d['qtd_divergencia'] !== 0 && d['enderecamento'] !== 'desconhecido').map(d => d.base_id) })
    } else {
      this.setState({ selected: [] });
    }
    return false
  }
  render() {
    const { divergencia, divergencia2, checkAll, showModal, cod_barra, desc, saldo } = this.state
    const selectRowProp = {
      mode: 'checkbox', 
      columnWidth: '60px',
      onSelect: this.onRowSelect,
      onSelectAll: this.onSelectAll,
      unselectable: divergencia2.filter(d => d['qtd_divergencia'] === 0).map(d => d.base_id),
      selected: this.state.selected
    }

    const options = {
      defaultSortName: 'valor_divergente',
      defaultSortOrder: 'asc', 
      noDataText: 'Não há dados para exibir',
      exportCSVText: 'Exportar para csv'
    }
    return (
      <div className="content">      
        <div>
          <div className="d-inline p-2"><NaoContados /></div>
          <div className="d-inline p-2"><Download /></div>
          <div className="d-inline p-2">
            <ExcelFile
              filename="divergencia"
              element={<Button variant="info">Baixar divergência</Button>}>
              <ExcelSheet data={this.getListaChecados.bind(this)} name="Divergência">
                <ExcelColumn label="EAN" value="cod_barra"/>
                <ExcelColumn label="Descrição" value="descricao_item"/>
                <ExcelColumn label="Coleta" value="qtd_inventario"/>
                <ExcelColumn label="Saldo" value="saldo_estoque"/>
                <ExcelColumn label="Quantidade" value="qtd_divergencia"/>
                <ExcelColumn label="Valor" value="valor_divergente"/>
              </ExcelSheet>
            </ExcelFile>
          </div>
          <div className="d-inline p-2">
          <Button variant="info" onClick={this.atualizaBase.bind(this)}>Salvar base</Button>
          </div>
        </div>
        <h1>Divergencia</h1>
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
            <Col lg={4} md={4} sm={4}>
              <Button variant="info" onClick={this.auditar}>
                Auditoria
              </Button>
            </Col>
          </Row>
          <Row>
            <BootstrapTable data={divergencia2} height='340' scrollTop={ 'Bottom' }
              cellEdit={{
                mode: 'dbclick',
                beforeSaveCell: (row, cellName, cellValue) =>{
                  alert(`Salvar o saldo da célula com o valor ${cellValue}`);

                  let rowStr = '';
                  for (const prop in row) {
                    rowStr += prop + ': ' + row[prop] + '\n';
                  }
                },
                afterSaveCell: (row, cellName, cellValue)=>{
                  let div = this.state.divergencia2.map(item => {
                    if(item['base_id'] === row['base_id']) {
                      item['saldo_estoque'] =  Number(row['saldo_estoque'])
                      item['qtd_divergencia'] =  item['qtd_inventario'] - row['saldo_estoque']
                      item['valor_divergente'] = item['qtd_divergencia']*item['valor_custo']
                    }
                    return item
                  })
                  this.setState({divergencia2: div})
                  console.table(this.state.divergencia2)
                  return true;
                }
              }}
              selectRow={ selectRowProp } 
              striped search exportCSV
              options={ options }>
              <TableHeaderColumn dataField='base_id' isKey hidden>ID</TableHeaderColumn>
              <TableHeaderColumn dataField='cod_barra' editable={ false } width='140' dataSort>EAN</TableHeaderColumn>
              <TableHeaderColumn dataField='enderecamento' editable={ true } tdStyle={{whiteSpace: 'normal'}} dataSort>Enderecamento</TableHeaderColumn>
              <TableHeaderColumn dataField='descricao_item' editable={ false } tdStyle={{whiteSpace: 'normal'}} dataSort>Descrição</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd_inventario' editable={ false } width='80' dataSort>Coleta</TableHeaderColumn>
              <TableHeaderColumn dataField='saldo_estoque' width='80' dataSort editable={ { validator: jobStatusValidator } }>Saldo</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd_divergencia' editable={ false } width='90' dataSort>Quantidade</TableHeaderColumn>
              <TableHeaderColumn dataField='valor_divergente' editable={ false } width='100' dataSort dataFormat={ (cell, row) =>{
  return `<i class='glyphicon glyphicon-usd'>R$</i> ${cell}`;
} }>Valor</TableHeaderColumn>
            </BootstrapTable>
          </Row>
      	</Container>
        <Modal show={showModal} onHide={this.handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{desc}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <Form  onSubmit={this.atualizaLista}>
              <Form.Row>

                <Form.Group as={Col}>
                  <Form.Label>EAN</Form.Label>
                  <Form.Control name="cod_barra" onChange={this.handleChange3} value={cod_barra} />
                </Form.Group>

                <Form.Group as={Col}>
                  <Form.Label>Saldo</Form.Label>
                  <Form.Control type="number" name="saldo" onChange={this.handleChange3} value={saldo} />
                </Form.Group>
              </Form.Row>
              
              <Button variant="info" type="submit">
                Salvar
              </Button>
              <div className="p-2"/>
            </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    );
  }
}

export default Divergencia;
