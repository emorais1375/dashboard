import React, { Component } from "react";
import readXlsxFile from 'read-excel-file/node';
import Download from '../../components/Download'
import NaoContados from "../../components/NaoContados";
import { BootstrapTable, TableHeaderColumn}  from 'react-bootstrap-table'
import { ipcRenderer } from "electron";
import {
	Container,
	Form,
	Button,
  Row,
  Col,
  Modal,
  ButtonToolbar,
  FormControl,
} from "react-bootstrap"
import FileSaver from 'file-saver'


function jobStatusValidator(value) {
  const nan = isNaN(parseInt(Number(value), 10));
  if (nan) {
    return 'A coleta deve ser um inteiro!';
  }
  return true;
}

export default class Divergencia extends Component {
	constructor(props){
    super(props);
    this.state = {
      showModal: true,
      cod_barra: '', desc: '', saldo: 0,
      checkAll: false,
      divergencia: [],
      divergencia2: [],
      auditar1: [],
      auditar2: [],
      selected: [],
      base: [],
      coleta: [],
      organizar_por: 'Valor',
      tipo_coleta: 'INVENTARIO',
      inventario_id: localStorage.getItem('inv_id') || '',
      file: null,
      status: 'diverg', // [diverg,audit1,audit2]
      txt: ''
    }
    this.auditar = this.auditar.bind(this)
  }
  componentDidMount() {
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
    const {file} = this.state;
    if(file !== null) {
      readXlsxFile(file.path).then((rows) => {
        Promise.resolve(
          ipcRenderer.sendSync('updateBase', rows)
        ).then(cout_err => {
          if (cout_err) {
            alert('Erro ao atualizar saldo da base')
          } else{
            alert('Saldo da base atualizado')
          }
          this.getBase().then(()=>{
              this.createDivergencia()
          },(code, fatal)=>{
            alert('Erro ao ler a base: '+code+fatal)
          })
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
    })
  }
  getColeta(){
    return new Promise((resolve, reject)=>{
      const coleta = ipcRenderer.sendSync('getColeta', 'coleta')
      let results = []
      new Promise((resolve, reject)=>{
        coleta.forEach(col => {
          if (!results.find( elem => {
            if(elem.cod_barra === col.cod_barra && elem.enderecamento === col.enderecamento){
              elem.qtd_inventario += col.itens_embalagem
              return true;
            }
            return false;
          })){
            results.push({'cod_barra' : col.cod_barra, 'enderecamento': col.enderecamento,'qtd_inventario':col.itens_embalagem});
          }
        })
        resolve()
      }).then(()=>{
        this.setState({coleta: results})
      })
      resolve()
    })
  }
  createDivergencia(){
    const { base, coleta } = this.state
    let divergencia2 = []
    // Promise.resolve(
      // base.map(b =>{
      //   let element = coleta.filter(c => c.cod_barra === b.cod_barra) // todos da c na base
        // let element_fora = coleta.filter(c => c.cod_barra !== b.cod_barra) // todos da c nao base
        // if (element_fora.length) {
        //   let qtd_inventario_total = 0
        //   element_fora.map(element => {
        //     let div ={
        //       id: element['cod_barra'] + element['enderecamento'],
        //       cod_barra: element['cod_barra'],
        //       cod_interno: '',
        //       descricao_item: '',
        //       descricao_setor_secao: '',
        //       familia: '',
        //       grupo: '',
        //       base_id: null,
        //       inventario_id: element['inventario_id'],
        //       referencia: '',
        //       saldo_estoque: '',
        //       setor_secao: '',
        //       subfamilia: '',
        //       valor_custo: 0,
        //       valor_venda: 0,
        //       enderecamento: element['enderecamento'],
        //       qtd_inventario: element['qtd_inventario'],
        //       audit1: 0,
        //       audit1_selected: false,
        //       audit2: 0,
        //       audit2_selected: false
        //     }
        //     qtd_inventario_total += element['qtd_inventario']
        //     return div
        //   }).map(element => {
        //     element['qtd_divergencia'] = qtd_inventario_total - element['saldo_estoque']
        //     element['valor_divergente'] = Number(((qtd_inventario_total - element['saldo_estoque'])*element['valor_custo']).toFixed(2))
        //     if(element.qtd_divergencia !== 0) divergencia2.push(element)
        //   })
        // }
        // if (element.length) {
      //     let qtd_inventario_total = 0
      //     element.map(element => {
      //       let div ={
      //         id: element['cod_barra'] + element['enderecamento'],
      //         cod_barra: b['cod_barra'],
      //         cod_interno: b['cod_interno'],
      //         descricao_item: b['descricao_item'],
      //         descricao_setor_secao: b['descricao_setor_secao'],
      //         familia: b['familia'],
      //         grupo: b['grupo'],
      //         base_id: b['id'],
      //         inventario_id: b['inventario_id'],
      //         referencia: b['referencia'],
      //         saldo_estoque: b['saldo_estoque'],
      //         setor_secao: b['setor_secao'],
      //         subfamilia: b['subfamilia'],
      //         valor_custo: b['valor_custo'],
      //         valor_venda: b['valor_venda'],
      //         enderecamento: element['enderecamento'],
      //         qtd_inventario: element['qtd_inventario'],
      //         audit1: 0,
      //         audit1_selected: false,
      //         audit2: 0,
      //         audit2_selected: false
      //       }
      //       qtd_inventario_total += element['qtd_inventario']
      //       return div
      //     }).map(element => {
      //       element['qtd_divergencia'] = qtd_inventario_total - element['saldo_estoque']
      //       element['valor_divergente'] = Number(((qtd_inventario_total - element['saldo_estoque'])*element['valor_custo']).toFixed(2))
      //       if(element.qtd_divergencia !== 0) divergencia2.push(element)
      //     })
      //   }
      // })
      // this.setState({divergencia2})

    base.map(b =>{
      let element = coleta.filter(c => b.cod_barra === c.cod_barra)
      if (element.length) {
        let qtd_inventario_total = 0
        element.map(element => {
          let div ={
            id: element['cod_barra'] + element['enderecamento'],
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
            enderecamento: element['enderecamento'],
            qtd_inventario: element['qtd_inventario'],
            audit1: 0,
            audit1_selected: false,
            audit2: 0,
            audit2_selected: false
          }
          qtd_inventario_total += element['qtd_inventario']
          return div
        }).map(element => {
          element['qtd_divergencia'] = qtd_inventario_total - element['saldo_estoque']
          element['valor_divergente'] = Number(((qtd_inventario_total - element['saldo_estoque'])*element['valor_custo']).toFixed(2))
          if(element.qtd_divergencia !== 0) divergencia2.push(element)
        })
      }
    })

    this.setState({divergencia2})
  }
  auditar() {
    const {status, selected, divergencia2, auditar1} = this.state
      Promise.resolve(
        selected.map(s => {
          if (status==='diverg'){
            return divergencia2.find(d => d.id === s)
          } else {
            return auditar1.find(d => d.id === s)
          }
        })
      ).then(div => {
        if (div.length) {
          localStorage.setItem('div1', JSON.stringify(div))
          localStorage.setItem('rl_1', JSON.stringify(divergencia2))
          if (status==='diverg'){
            console.table(div)
            this.setState({status: 'audit1', auditar1: div, selected: []})
          } else if(status==='audit1') {
            this.setState({status: 'audit2', auditar2: div, selected: []})
          }
        } else {
          alert('Não foram selecionados itens para serem auditados.')
        }
      })
  }
  finalizar() {
    this.setState({ showModal: true })
  }
  voltar() {
    this.setState({status: 'diverg'})
  }
  onRowSelect({ id, qtd_divergencia, enderecamento }, isSelected) {
    if (isSelected && (qtd_divergencia === 0 || enderecamento === 'desconhecido')) {
      alert('O item não deu divergência ou não tem endereçamento');
    } else if (isSelected && (qtd_divergencia !== 0 || enderecamento !== 'desconhecido')){
      this.setState({
        selected: [ ...this.state.selected, id ].sort()
      });
    } else {
      this.setState({ selected: this.state.selected.filter(it => it !== id) })
    }
    return false;
  }
  onSelectAll(isSelected){
    if (isSelected) {
      const { status, divergencia2, auditar1 } = this.state
      alert('Marcar apenas itens com divergência e com endereçamento');
      if(status === 'diverg') {
        this.setState({ 
          selected: this.state.divergencia2.filter(
            d => d['qtd_divergencia'] !== 0 && d['enderecamento'] !== 'desconhecido'
          ).map(d => d.id) 
        })
      } else {
        this.setState({ 
          selected: this.state.auditar1.filter(
            d => d['qtd_divergencia'] !== 0 && d['enderecamento'] !== 'desconhecido'
          ).map(d => d.id) 
        })

      }
    } else {
      this.setState({ selected: [] });
    }
    return false
  }
  handleClose() {
    this.setState({ showModal: false });
  }
  exportarTXT() {
    const {txt} = this.state
    let blob = new Blob([txt], {type: "text/plain;charset=utf-8"});
    FileSaver.saveAs(blob, "base.txt");
  }
  handClearTXT() {
    this.setState({txt: ''})
  }
  hendlChangeTXT(e) {
    const {txt, divergencia2} = this.state
    const value = e.target.value
    this.setState({txt: txt+value})
  }
  render() {
    const { txt, status, auditar1, auditar2, divergencia2 } = this.state
    const selectRowProp = {
      mode: 'checkbox', 
      columnWidth: '60px',
      onSelect: this.onRowSelect.bind(this),
      onSelectAll: this.onSelectAll.bind(this),
      unselectable: divergencia2.filter(d => d['qtd_divergencia'] === 0).map(d => d.base_id),
      selected: this.state.selected
    }
    const options = {
      defaultSortName: 'valor_divergente',
      defaultSortOrder: 'asc', 
      noDataText: 'Não há dados para exibir',
      exportCSVText: 'Exportar para csv'
    }
    let titulo = 'Divergencia'
    if (status==='audit1'){
      titulo = 'Auditoria 1'
    } else if(status==='audit2') {
      titulo = 'Auditoria 2'
    }
    return (
      <div className="content">
        <div>
          <div className="d-inline p-2"><NaoContados /></div>
          <div className="d-inline p-2"><Download /></div>
        </div>
        <h1>{titulo}</h1>
        <Container fluid>
        { status==='diverg' && 
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
        }
          <Row><div className="p-2"/>
              {status !=='audit2' && <Button variant="info" onClick={this.auditar}>
                Auditoria
              </Button>}<div className="p-2"/>
              <Button variant="danger" onClick={this.finalizar.bind(this)}>
                Finalizar
              </Button><div className="p-2"/>
              <Button variant="danger" onClick={this.voltar.bind(this)}>
                Voltar
              </Button>
          </Row><div className="p-2"/>
          <Row>
            { status ==='diverg' && <BootstrapTable data={divergencia2} height='340' scrollTop={ 'Bottom' }
              cellEdit={{
                mode: 'dbclick',
                beforeSaveCell: (row, cellName, cellValue) =>{
                  if(row.cod_barra !== cellValue && row.descricao_item==='desconhecido') {
                    if(this.state.divergencia2.find(d=>d.cod_barra===cellValue)){
                      alert('existe')
                    } else {
                      alert(`EAN ${cellValue} não existe na base`)
                    }
                  } else {
                    alert(`EAN ${cellValue} é o mesmo ou já está na base`)
                  }
                  return false
                },
                afterSaveCell: (row, cellName, cellValue)=>{
                  const {divergencia2} = this.state
                  const id = row['cod_barra']+row['enderecamento']
                  let div = []
                  divergencia2.map(d=>{
                    if(d['id'] === row['id']) {
                      if(!divergencia2.find(d => d.id === id)){
                        d['id'] = id
                      }
                    }
                    if(d.cod_barra === cellValue && d.id !== row.id){
                      
                    } else {
                      div.push(d)
                    }
                  })
                  this.setState({divergencia2: div})
                }
              }}
              selectRow={ selectRowProp } 
              striped search exportCSV
              options={ options }>
              <TableHeaderColumn dataField='id' isKey hidden>ID</TableHeaderColumn>
              <TableHeaderColumn dataField='cod_barra' editable={ true } width='140' dataSort>EAN  ({divergencia2.length})</TableHeaderColumn>
              <TableHeaderColumn dataField='enderecamento' editable={ false } tdStyle={{whiteSpace: 'normal'}} dataSort>Enderecamento</TableHeaderColumn>
              <TableHeaderColumn dataField='descricao_item' editable={ false } tdStyle={{whiteSpace: 'normal'}} dataSort>Descrição</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd_inventario' editable={ false } width='80' dataSort>Coleta</TableHeaderColumn>
              <TableHeaderColumn dataField='saldo_estoque' editable={ false } width='80' dataSort>Saldo</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd_divergencia' editable={ false } width='90' dataSort>Quantidade</TableHeaderColumn>
              <TableHeaderColumn dataField='valor_divergente' editable={ false } width='100' dataSort dataFormat={ (cell, row) =>{
  return `<i class='glyphicon glyphicon-usd'>R$</i> ${cell}`;
} }>Valor</TableHeaderColumn>
            </BootstrapTable>
            }  

            {status ==='audit1' && <BootstrapTable data={auditar1} height='340' scrollTop={ 'Bottom' }
              cellEdit={{
                mode: 'dbclick',
                beforeSaveCell: (row, cellName, cellValue) =>{
                  console.log('beforeSaveCell')
                  alert(`Salvar o saldo da célula com o valor ${cellValue}`);

                  let rowStr = '';
                  for (const prop in row) {
                    rowStr += prop + ': ' + row[prop] + '\n';
                  }
                },
                afterSaveCell: (row, cellName, cellValue)=>{
                  let qtd_inventario_total = 0
                  let div = this.state.auditar1.map(item => {
                    if(item['id'] === row['id']) {
                      item['qtd_inventario'] =  Number(cellValue)
                      qtd_inventario_total += Number(cellValue)
                    } else if (item['base_id'] === row['base_id']){
                      qtd_inventario_total += item['qtd_inventario']
                    }
                    return item
                  }).map(item => {
                    if(item['base_id'] === row['base_id']) {
                      item['qtd_divergencia'] = qtd_inventario_total - item['saldo_estoque']
                      item['valor_divergente'] = Number(((qtd_inventario_total - item['saldo_estoque'])*item['valor_custo']).toFixed(2))
                    }
                    return item
                  })
                  this.setState({auditar1: div})
                  return true;
                }
              }}
              selectRow={ selectRowProp } 
              striped search exportCSV
              options={ options }>
              <TableHeaderColumn dataField='id' isKey hidden>ID</TableHeaderColumn>
              <TableHeaderColumn dataField='cod_barra' editable={ false } width='140' dataSort>EAN ({auditar1.length})</TableHeaderColumn>
              <TableHeaderColumn dataField='enderecamento' editable={ false } tdStyle={{whiteSpace: 'normal'}} dataSort>Enderecamento</TableHeaderColumn>
              <TableHeaderColumn dataField='descricao_item' editable={ false } tdStyle={{whiteSpace: 'normal'}} dataSort>Descrição</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd_inventario' editable={ false } width='80' dataSort editable={ { validator: jobStatusValidator } }>Coleta</TableHeaderColumn>
              <TableHeaderColumn dataField='saldo_estoque' editable={ false }  width='80' dataSort>Saldo</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd_divergencia' editable={ false } width='90' dataSort>Quantidade</TableHeaderColumn>
              <TableHeaderColumn dataField='valor_divergente' editable={ false } width='100' dataSort dataFormat={ (cell, row) =>{
  return `<i class='glyphicon glyphicon-usd'>R$</i> ${cell}`;
} }>Valor</TableHeaderColumn>
            </BootstrapTable>
            }  

            {status ==='audit2' && <BootstrapTable data={auditar2} height='340' scrollTop={ 'Bottom' }
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
                  let qtd_inventario_total = 0
                  let div = this.state.auditar2.map(item => {
                    if(item['id'] === row['id']) {
                      item['qtd_inventario'] =  Number(cellValue)
                      qtd_inventario_total += Number(cellValue)
                    } else if (item['base_id'] === row['base_id']){
                      qtd_inventario_total += item['qtd_inventario']
                    }
                    return item
                  }).map(item => {
                    if(item['base_id'] === row['base_id']) {
                      item['qtd_divergencia'] = qtd_inventario_total - item['saldo_estoque']
                      item['valor_divergente'] = Number(((qtd_inventario_total - item['saldo_estoque'])*item['valor_custo']).toFixed(2))
                    }
                    return item
                  })
                  this.setState({auditar2: div})
                  return true;
                }
              }}
              striped search exportCSV
              options={ options }>
              <TableHeaderColumn dataField='id' isKey hidden>ID</TableHeaderColumn>
              <TableHeaderColumn dataField='cod_barra' editable={ false } width='140' dataSort>EAN  ({auditar1.length})</TableHeaderColumn>
              <TableHeaderColumn dataField='enderecamento' editable={ false } tdStyle={{whiteSpace: 'normal'}} dataSort>Enderecamento</TableHeaderColumn>
              <TableHeaderColumn dataField='descricao_item' editable={ false } tdStyle={{whiteSpace: 'normal'}} dataSort>Descrição</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd_inventario' width='80' dataSort editable={ { validator: jobStatusValidator } }>Coleta</TableHeaderColumn>
              <TableHeaderColumn dataField='saldo_estoque' editable={ false } width='80' dataSort>Saldo</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd_divergencia' editable={ false } width='90' dataSort>Quantidade</TableHeaderColumn>
              <TableHeaderColumn dataField='valor_divergente' editable={ false } width='100' dataSort dataFormat={ (cell, row) =>{
  return `<i class='glyphicon glyphicon-usd'>R$</i> ${cell}`;
} }>Valor</TableHeaderColumn>
            </BootstrapTable>
            }  
          </Row>
      	</Container>
      <Modal show={this.state.showModal} onHide={this.handleClose.bind(this)}>
        <Modal.Header closeButton>
          <Modal.Title>Gerar TXT</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ButtonToolbar>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='.'>.</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value=','>,</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value=';'>;</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='"'>"</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value=' '>ESPAÇO</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='DEPARTAMENTO'>DEPARTAMENTO</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='SETOR'>SETOR</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='GRUPO'>GRUPO</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='FAMILIA'>FAMILIA</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='SUBFAMILIA'>SUBFAMILIA</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='EAN'>EAN</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='REFERENCIA'>REFERENCIA</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='COD_INTERNO'>COD_INTERNO</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='DESCRICAO'>DESCRICAO</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='SALDO'>SALDO</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='QUANT_INVENT'>QUANT_INVENT</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='QUANT_DIVERG'>QUANT_DIVERG</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='CUSTO'>CUSTO</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='VENDA'>VENDA</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='CUSTO_SALDO'>CUSTO CUSTO_SALDO</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='VENDA_SALDO'>VENDA_SALDO</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='CUSTO_INVENT'>CUSTO_INVENT</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='VENDA_INVENT'>VENDA_INVENT</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='CUSTO_DIVERG'>CUSTO_DIVERG</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} value='VENDA_DIVERG'>VENDA_DIVERG</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} disabled value='LOTE'>LOTE</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} disabled value='FABRICAÇÃO'>FABRICAÇÃO</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} disabled value='VALIDADE'>VALIDADE</Button>
            <Button variant="info" onClick={this.hendlChangeTXT.bind(this)} disabled value='QUANTIDADE'>QUANTIDADE</Button>
          </ButtonToolbar>
          <FormControl as="textarea" aria-label="With textarea" value={txt} readOnly/>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="info" onClick={this.handClearTXT.bind(this)}>
            Limpar
          </Button>
          <Button variant="info" onClick={this.exportarTXT.bind(this)}>
            Exportar
          </Button>
          <Button variant="secondary" onClick={this.handleClose.bind(this)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    );
  }
}
