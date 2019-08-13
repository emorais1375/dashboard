import React, { Component } from "react";
import readXlsxFile from 'read-excel-file/node';
import ReactExport from "react-data-export"
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
  InputGroup,
  ButtonGroup
} from "react-bootstrap"
import FileSaver from 'file-saver'

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

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
      showModal: false,
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
      txt: '', padrao: '',
      rl_div: [],
      confronto: [],
      itensNaoContados: [],


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
      Promise.resolve(
        base.map(b=>{
          b['cod_barra'] = b['cod_barras']
          b['descricao_setor_secao'] = b['departamento']
          b['inventario_id'] = b['inventario']
          b['saldo_estoque'] = b['saldo_qtd_estoque']
          b['id'] = b['_id']
          return b
        })
      ).then(base=>{
        this.setState({base})
        resolve()
      })
    })
  }
  getColeta(){
    return new Promise((resolve, reject)=>{
      const coleta = ipcRenderer.sendSync('getColeta', 'coleta')
      let results = []
      new Promise((resolve, reject)=>{
        coleta.forEach(col => {
          if (!results.find( elem => {
            if(elem.cod_barra === col.cod_barra && elem.enderecamento === col.enderecamento && 
              elem.validade === col.validade && elem.lote === col.lote){
              elem.qtd_inventario += col.itens_embalagem
              return true;
            }
            return false;
          })){
            results.push({
              'cod_barra' : col.cod_barra, 
              'enderecamento': col.enderecamento,
              'qtd_inventario':col.itens_embalagem,
              'validade': col.validade,
              'lote': col.lote,
              'fabricacao': col.fabricacao,
              'inventario_id': col.inventario_id
            });
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
    Promise.resolve(
      base.map(b =>{
        let element = coleta.filter(c => b.cod_barra === c.cod_barra)
        if (element.length) {
          let qtd_inventario_total = 0
          element.map(element => {
            let div ={
              id: element['cod_barra'] + element['enderecamento'] + element['validade'] + element['lote'],
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
              audit2_selected: false,
              validade: element['validade'],
              lote: element['lote'],
              fabricacao: element['fabricacao']
            }
            qtd_inventario_total += element['qtd_inventario']
            return div
          }).map(element => {
            element['qtd_divergencia'] = qtd_inventario_total - element['saldo_estoque']
            element['valor_divergente'] = Number(((qtd_inventario_total - element['saldo_estoque'])*element['valor_custo']).toFixed(2))
            divergencia2.push(element)
          })
        }
      })
    ).then(()=>{
      const fora_base = coleta.filter(c => !base.map(b=>b.cod_barra).includes(c.cod_barra))
      const fora_base_c = [...new Set(fora_base.map(fb=>fb.cod_barra))]
      fora_base_c.map(b=>{
        let element = fora_base.filter(c => b === c.cod_barra)
        if (element.length) {
          let qtd_inventario_total = 0
          element.map(element => {
            let div ={
              id: element['cod_barra'] + element['enderecamento'] + element['validade'] + element['lote'],
              cod_barra: element['cod_barra'],
              cod_interno: '',
              descricao_item: '',
              descricao_setor_secao: '',
              familia: '',
              grupo: '',
              base_id: '',
              inventario_id: element['inventario_id'],
              referencia: '',
              saldo_estoque: 0,
              setor_secao: '',
              subfamilia: '',
              valor_custo: null,
              valor_venda: null,
              enderecamento: element['enderecamento'],
              qtd_inventario: element['qtd_inventario'],
              audit1: 0,
              audit1_selected: false,
              audit2: 0,
              audit2_selected: false,
              validade: element['validade'],
              lote: element['lote'],
              fabricacao: element['fabricacao']
            }
            qtd_inventario_total += element['qtd_inventario']
            return div
          }).map(element => {
            element['qtd_divergencia'] = qtd_inventario_total - element['saldo_estoque']
            element['valor_divergente'] = Number(((qtd_inventario_total - element['saldo_estoque'])*element['valor_custo']).toFixed(2))
            divergencia2.push(element)
          })
        }
      })
    }).then(()=>{
      const nao_cout = base.filter(b => !coleta.map(c=>c.cod_barra).includes(b.cod_barra))
      nao_cout.map(b=>{
        let div ={
          id: b['cod_barra'],
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
          enderecamento: '',
          qtd_inventario: 0,
          audit1: 0,
          audit1_selected: false,
          audit2: 0,
          audit2_selected: false,
          validade: '',
          lote: '',
          fabricacao: '',
          qtd_divergencia: b['saldo_estoque']*-1,
          valor_divergente: Number((b['saldo_estoque']*-1*b['valor_custo']).toFixed(2))
        }
        divergencia2.push(div)
      })
    }).then(()=>{
      this.setState({divergencia2, rl_div: divergencia2})
    })
  }
  auditar() {
    const {status, selected, divergencia2, auditar1} = this.state
      Promise.resolve(
        divergencia2.map(d => {
          if (selected.includes(d.id)) {
            if (status==='diverg'){
              d['audit1_selected'] = true
              d['audit1'] = d['qtd_inventario']
            }
            else {
              d['audit2_selected'] = true
              d['audit2'] = d['audit1']
            }
          }
          return d
        })
      ).then(div => {
        if (selected.length) {
          if (status==='diverg'){
            this.setState({status: 'audit1', divergencia2: div, selected: []})
          } else if(status==='audit1') {
            this.setState({status: 'audit2', divergencia2: div, selected: []})
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
    if(this.state.status === 'audit1'){
      this.setState({status: 'diverg', selected: []})
    } else if(this.state.status === 'audit2'){
      this.setState({status: 'audit1'})
    }
  }
  onRowSelect({ id, qtd_divergencia, enderecamento, base_id }, isSelected) {
    if (isSelected && (qtd_divergencia === 0 || enderecamento === 'desconhecido' || base_id === '')) {
      alert('O item não deu divergência ou não tem endereçamento');
    } else if (isSelected && (qtd_divergencia !== 0 || enderecamento !== 'desconhecido' || base_id !== '')){
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
            d => d.qtd_inventario !==0 && d['base_id'] !== '' && d['qtd_divergencia'] !== 0 && d['enderecamento'] !== 'desconhecido'
          ).map(d => d.id) 
        })
      } else {
        this.setState({ 
          selected: this.state.divergencia2.filter(
            d => d.qtd_inventario !==0 &&  d['audit1_selected'] === true && d['base_id'] !== '' && d['qtd_divergencia'] !== 0 && d['enderecamento'] !== 'desconhecido'
          ).map(d => d.id) 
        })

      }
    } else {
      this.setState({ selected: [] });
    }
    return false
  }
  handleClose() {
    this.setState({ showModal: false, txt: '', padrao: ''});
  }
  exportarTXT() {
    const {txt} = this.state
    let blob = new Blob([txt], {type: "text/plain;charset=utf-8"});
    FileSaver.saveAs(blob, "base.txt");
  }
  handClearTXT() {
    this.setState({txt: '', padrao: ''})
  }
  hendlChangeTXT(e) {
    const {divergencia2, auditar1, auditar2, padrao} = this.state
    const value = e.target.value
    let msg = padrao + value + '\n'
    const p = padrao + value
    divergencia2.map(d=>{
      const a1 = auditar1.find(a1=>a1.id === d.id)
      const a2 = auditar2.find(a2=>a2.id === d.id)
      if(a2){
        d['qtd_inventario'] = a2['qtd_inventario']
        d['qtd_divergencia'] = a2['qtd_divergencia']
        d['valor_divergente'] = a2['valor_divergente']
      } else if(a1){
        d['qtd_inventario'] = a1['qtd_inventario']
        d['qtd_divergencia'] = a1['qtd_divergencia']
        d['valor_divergente'] = a1['valor_divergente']
      }
      return d
    }).map(d=>{
      msg += eval('`'+p+'`')
    })
    const msg_nova = [...new Set(msg.split('\n'))]
    let msg_nova1 = ''
    msg_nova.forEach(m=>{
      msg_nova1 += m + '\n'
    })
    this.setState({txt: msg_nova1, padrao: p})
  }
  hendleChangePadrao(e){
    const target = e.target
    const value = target.value
    const name = target.name
    const type = target.type
    if (type === 'text') {
      this.setState({[name]: value})
    } else if (type === 'button'){
      let padrao = this.state.padrao + value
      this.setState({padrao})
    }
  }
  hendleClickModelo(e){
    const target = e.target
    const value = target.value
    const name = target.name
    const type = target.type
    const diverg = this.state.divergencia2.map(d=>{
      const a1 = this.state.auditar1.find(a1=>a1.id === d.id)
      const a2 = this.state.auditar2.find(a2=>a2.id === d.id)
      if(a2){
        d['qtd_inventario'] = a2['qtd_inventario']
        d['qtd_divergencia'] = a2['qtd_divergencia']
        d['valor_divergente'] = a2['valor_divergente']
      } else if(a1){
        d['qtd_inventario'] = a1['qtd_inventario']
        d['qtd_divergencia'] = a1['qtd_divergencia']
        d['valor_divergente'] = a1['valor_divergente']
      }
      return d
    })
    let msg_nova = []
    let msg_nova1 = ''
    let msg = ''
    switch (name) {
      case 'ModAdicion':
        diverg.map(d=>{
          msg += `${d.cod_barra},${d.qtd_inventario}\n`
        })
        msg_nova = [...new Set(msg.split('\n'))]
        msg_nova1 = ''
        msg_nova.forEach(m=>{
          msg_nova1 += m + '\n'
        })
        this.setState({txt: msg_nova1, padrao: ''})
        break;
      case 'ModAtivo':
        msg = '1,1,01\n2,ENDERECO\n'
        diverg.map(d=>{
          let p = '3,${d.cod_barra},${d.lote},${d.fabricacao},${d.validade},'+('000000' + d.qtd_inventario).slice(-6)+'\n'
          msg += eval('`'+p+'`')
        })
        msg_nova = [...new Set(msg.split('\n'))]
        msg_nova1 = ''
        msg_nova.forEach(m=>{
          msg_nova1 += m + '\n'
        })
        this.setState({txt: msg_nova1, padrao: ''})
        break;
      case 'ModWinthor':
        msg = 'EAN                    QUANT\n'
        diverg.map(d=>{
          let p = ("00000000000000" + d.cod_barra).slice(-14) + ('000000' + d.qtd_inventario).slice(-6) + '\n'
          msg += eval('`'+p+'`')
        })
        msg_nova = [...new Set(msg.split('\n'))]
        msg_nova1 = ''
        msg_nova.forEach(m=>{
          msg_nova1 += m + '\n'
        })
        this.setState({txt: msg_nova1, padrao: ''})
        break;

      case 'ModMicrovixLynx':
          diverg.map(d=>{
            for (let i = 0; i < d.qtd_inventario; i++) {
              let p = d.cod_barra + '\n'
              msg += eval('`'+p+'`')
            }
          })
          this.setState({txt: msg, padrao: ''})
        break;

      case 'ModTropical13':
        diverg.map(d=>{
          let p = ("0000000000000" + d.cod_barra).slice(-13) + ';' + ('0000000000000' + d.qtd_inventario).slice(-13) + '\n'
          msg += eval('`'+p+'`')
        })
        msg_nova = [...new Set(msg.split('\n'))]
        msg_nova1 = ''
        msg_nova.forEach(m=>{
          msg_nova1 += m + '\n'
        })
        this.setState({txt: msg_nova1, padrao: ''})
        break;

      case 'ModTropical14':
        diverg.map(d=>{
          let p = ("00000000000000" + d.cod_barra).slice(-14) + ';' + ('0000000000000' + d.qtd_inventario).slice(-13) + '\n'
          msg += eval('`'+p+'`')
        })
        msg_nova = [...new Set(msg.split('\n'))]
        msg_nova1 = ''
        msg_nova.forEach(m=>{
          msg_nova1 += m + '\n'
        })
        this.setState({txt: msg_nova1, padrao: ''})
        break;

      default:
        console.log(`Sorry, we are out of ${name}.`)
    }
  }
  hendleChangeTXT(e){
    const {divergencia2, auditar1, auditar2, padrao} = this.state
    let msg = padrao + '\n'
    const p = padrao
    divergencia2.map(d=>{
      const a1 = auditar1.find(a1=>a1.id === d.id)
      const a2 = auditar2.find(a2=>a2.id === d.id)
      if(a2){
        d['qtd_inventario'] = a2['qtd_inventario']
        d['qtd_divergencia'] = a2['qtd_divergencia']
        d['valor_divergente'] = a2['valor_divergente']
      } else if(a1){
        d['qtd_inventario'] = a1['qtd_inventario']
        d['qtd_divergencia'] = a1['qtd_divergencia']
        d['valor_divergente'] = a1['valor_divergente']
      }
      return d
    }).map(d=>{
      msg += eval('`'+p+'`')
    })
    const msg_nova = [...new Set(msg.split('\n'))]
    let msg_nova1 = ''
    msg_nova.forEach(m=>{
      msg_nova1 += m + '\n'
    })
    this.setState({txt: msg_nova1})
  }
  returnConfronto(){
    const {divergencia2} = this.state

    let results = []
    divergencia2.forEach(col => {
      if (!results.find( elem => {
        if(elem.cod_barra === col.cod_barra){
          return true;
        }
        return false;
      })){
        results.push({
          'descricao_setor_secao' : col.descricao_setor_secao, 
          'setor_secao': col.setor_secao,
          'grupo':col.grupo,
          'familia': col.familia,
          'subfamilia': col.subfamilia,
          'cod_barra': col.cod_barra,
          'descricao_item' : col.descricao_item, 
          'saldo_estoque': col.saldo_estoque,
          'qtd_inv_final': col.qtd_divergencia + col.saldo_estoque,
          'valor_custo': col.valor_custo,
          'valor_venda': col.valor_venda,
          'qtd_divergencia': col.qtd_divergencia
        });
      }
    })
    return results
  }
  returnDiverg(){
    
    const {divergencia2} = this.state

    let results = []
    divergencia2.forEach(col => {
      if (!results.find( elem => {
        if(elem.cod_barra === col.cod_barra && 
          elem.cod_barra === col.cod_barra){
          return true;
        }
        return false;
      })){
        results.push({
          'enderecamento': col.enderecamento,
          'descricao_setor_secao': col.descricao_setor_secao,
          'setor_secao': col.setor_secao,
          'cod_interno': col.cod_interno,
          'cod_barra': col.cod_barra,
          'base_id': col.base_id,
          'descricao_item' : col.descricao_item,
          'qtd_inv_final': col.qtd_divergencia + col.saldo_estoque,
          'qtd_divergencia': col.qtd_divergencia
        });
      }
    })
    return results.filter(r=>r.qtd_divergencia!==0 && r.base_id!=='' && r.qtd_inv_final !==0 )
  }
  returnContagem(){
    const {divergencia2} = this.state
    return divergencia2.map(d=>{
      if(d.audit2_selected)
        d['cout_final'] =  d['audit2']
      else if(d.audit1_selected)
        d['cout_final'] =  d['audit1']
      else
        d['cout_final'] =  d['qtd_inventario']
      return d
    }).filter(d=>d.qtd_inventario!==0)
  }
  returnNaoContados(){
    const { base,coleta } = this.state
    const nao_cout = base.filter(b => !coleta.map(c=>c.cod_barra).includes(b.cod_barra))
    return nao_cout
  }
  returnResumoConf(){
    const { divergencia2 } = this.state

    let res = []
    let total_invent = 0
    let total_saldo = 0
    let total_diverg = 0
    let div_positiva = 0
    let div_negativa = 0
   
    let custo_total_invent = 0
    let custo_total_saldo = 0
    let custo_total_diverg = 0
    let custo_div_positiva = 0
    let custo_div_negativa = 0
    
    let venda_total_invent = 0
    let venda_total_saldo = 0
    let venda_total_diverg = 0
    let venda_div_positiva = 0
    let venda_div_negativa = 0

    let results = []
    divergencia2.forEach(col => {
      if (!results.find( elem => {
        if(elem.cod_barra === col.cod_barra){
          return true;
        }
        return false;
      })){
        results.push({
          'descricao_setor_secao' : col.descricao_setor_secao, 
          'setor_secao': col.setor_secao,
          'grupo':col.grupo,
          'familia': col.familia,
          'subfamilia': col.subfamilia,
          'cod_barra': col.cod_barra,
          'descricao_item' : col.descricao_item, 
          'saldo_estoque': col.saldo_estoque,
          'qtd_inv_final': col.qtd_divergencia + col.saldo_estoque,
          'valor_custo': col.valor_custo,
          'valor_venda': col.valor_venda,
          'qtd_divergencia': col.qtd_divergencia
        });
      }
    })
    results.forEach(d=>{
      total_invent += d.qtd_divergencia+d.saldo_estoque
      total_saldo += d.saldo_estoque
      total_diverg += d.qtd_divergencia
      
      custo_total_invent += (d.qtd_divergencia+d.saldo_estoque)*d.valor_custo
      custo_total_saldo += d.saldo_estoque*d.valor_custo
      custo_total_diverg += d.qtd_divergencia*d.valor_custo
      
      venda_total_invent += (d.qtd_divergencia+d.saldo_estoque)*d.valor_venda
      venda_total_saldo += d.saldo_estoque*d.valor_venda
      venda_total_diverg += d.qtd_divergencia*d.valor_venda

      if (!d.saldo_estoque) {
        div_positiva += d.qtd_divergencia
        custo_div_positiva += d.qtd_divergencia*d.valor_custo
        venda_div_positiva += d.qtd_divergencia*d.valor_venda
      }
      if (!(d.qtd_divergencia+d.saldo_estoque)){
        div_negativa += d.saldo_estoque
        custo_div_negativa += d.saldo_estoque*d.valor_custo
        venda_div_negativa += d.saldo_estoque*d.valor_venda
      }
    })
    res = [
        {'title': 'TOTAL INVENTARIADO', 'data': total_invent},
        {'title': 'TOTAL NO SALDO', 'data': total_saldo},
        {'title': 'TOTAL DAS DIVERGÊNCIAS NEGATIVAS', 'data': div_negativa},
        {'title': '% TOTAL DAS DIVERGÊNCIAS NEGATIVAS', 'data': div_negativa/100},
        {'title': 'TOTAL DAS DIVERGÊNCIAS POSITIVAS', 'data': div_positiva},
        {'title': '% TOTAL DAS DIVERGÊNCIAS POSITIVAS', 'data': div_positiva/100},
        {'title': 'TOTAL DA DIVERGÊNCIA', 'data': total_diverg},
        {'title': '% TOTAL DA DIVERGÊNCIA', 'data': total_diverg/100},
  
        {'title': '', 'data': ''},
        {'title': 'TOTAL INVENTARIADO', 'data': custo_total_invent},
        {'title': 'TOTAL NO SALDO', 'data': custo_total_saldo},
        {'title': 'TOTAL DAS DIVERGÊNCIAS NEGATIVAS', 'data': custo_div_negativa},
        {'title': '% TOTAL DAS DIVERGÊNCIAS NEGATIVAS', 'data': custo_div_negativa/100},
        {'title': 'TOTAL DAS DIVERGÊNCIAS POSITIVAS', 'data': custo_div_positiva},
        {'title': '% TOTAL DAS DIVERGÊNCIAS POSITIVAS', 'data': custo_div_positiva/100},
        {'title': 'TOTAL DA DIVERGÊNCIA', 'data': custo_total_diverg},
        {'title': '% TOTAL DA DIVERGÊNCIA', 'data': custo_total_diverg/100},
  
        {'title': '', 'data': ''},
        {'title': 'TOTAL INVENTARIADO', 'data': venda_total_invent},
        {'title': 'TOTAL NO SALDO', 'data': venda_total_saldo},
        {'title': 'TOTAL DAS DIVERGÊNCIAS NEGATIVAS', 'data': venda_div_negativa},
        {'title': '% TOTAL DAS DIVERGÊNCIAS NEGATIVAS', 'data': venda_div_negativa/100},
        {'title': 'TOTAL DAS DIVERGÊNCIAS POSITIVAS', 'data': venda_div_positiva},
        {'title': '% TOTAL DAS DIVERGÊNCIAS POSITIVAS', 'data': venda_div_positiva/100},
        {'title': 'TOTAL DA DIVERGÊNCIA', 'data': venda_total_diverg},
        {'title': '% TOTAL DA DIVERGÊNCIA', 'data': venda_total_diverg/100},
      ]    

    return res
  }
  render() {
    const { confronto, rl_div, itensNaoContados, txt, padrao, teste, status, auditar1, auditar2, divergencia2 } = this.state
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
    const multiDataSet = [
      {
        columns: [
          {title: '', width: {wch:50}}, //pixel
          {title: '', width: {wch:30}}, //char
        ],
        data: [
          
          [
            {value: 'RESUMO DAS QUANTIDADES', style: {font: {sz: '11'}}},
            {value: ''},
          ],
          [
            {value: 'TOTAL INVENTARIADO', style: {font: {sz: '11'}}},
            {value: 6193, style: {font: {sz: '11'}}},
          ],
          [
            {value: 'TOTAL NO SALDO', style: {font: {sz: '11'}}},
            {value: 6427, style: {font: {sz: '11'}}},
          ],
          [
            {value: 'TOTAL DAS DIVERGÊNCIAS NEGATIVAS', style: {font: {sz: '11'}}},
            {value: 6193, style: {font: {sz: '11'}}},
          ],
          [
            {value: '% TOTAL DAS DIVERGÊNCIAS NEGATIVAS', style: {font: {sz: '11'}}},
            {value: 6427, style: {font: {sz: '11'}}},
          ],
          [
            {value: 'TOTAL DAS DIVERGÊNCIAS POSITIVAS', style: {font: {sz: '11'}}},
            {value: 6193, style: {font: {sz: '11'}}},
          ],
          [
            {value: '% TOTAL DAS DIVERGÊNCIAS POSITIVAS', style: {font: {sz: '11'}}},
            {value: 6427, style: {font: {sz: '11'}}},
          ],
          [
            {value: 'TOTAL DA DIVERGÊNCIA', style: {font: {sz: '11'}}},
            {value: 6193, style: {font: {sz: '11'}}},
          ],
          [
            {value: '% TOTAL DA DIVERGÊNCIA', style: {font: {sz: '11'}}},
            {value: 6427, style: {font: {sz: '11'}}},
          ],
        ]
      }
    ]
    
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
          {/* <div className="d-inline p-2"><Download /></div> */}
          <div className="d-inline p-2">
            <ExcelFile
                filename="rl_relatorios"
                element={<Button variant="info">Baixar relatórios</Button>}>
                <ExcelSheet data={this.returnConfronto.bind(this)} name="Confronto">
                    <ExcelColumn label="DEPARTAMENTO" value="descricao_setor_secao"/>
                    <ExcelColumn label="SETOR" value="setor_secao"/>
                    <ExcelColumn label="GRUPO" value="grupo"/>
                    <ExcelColumn label="FAMÍLIA" value="familia"/>
                    <ExcelColumn label="SUBFAMILIA" value="subfamilia"/>
                    <ExcelColumn label="EAN" value="cod_barra"/>
                    <ExcelColumn label="REFERÊNCIA" value="referencia"/>
                    <ExcelColumn label="CÓDIGO INTERNO" value="cod_interno"/>
                    <ExcelColumn label="DESCRIÇÃO" value="descricao_item"/>
                    <ExcelColumn label="SALDO" value="saldo_estoque"/>
                    <ExcelColumn label="QUANT INVENT" value="qtd_inv_final"/>
                    <ExcelColumn label="CUSTO" value="valor_custo"/>
                    <ExcelColumn label="VENDA" value="valor_venda"/>
                    <ExcelColumn label="DIVERG" value="qtd_divergencia"/>
                    <ExcelColumn label="CUSTO SALDO" value={(c)=> Number((c.valor_custo*c.saldo_estoque).toFixed(2))}/>
                    <ExcelColumn label="VENDA SALDO" value={(c)=> Number((c.valor_venda*c.saldo_estoque).toFixed(2))}/>
                    <ExcelColumn label="CUSTO INVENT" value={(c)=> Number((c.valor_custo*c.qtd_inv_final).toFixed(2))}/>
                    <ExcelColumn label="VENDA INVENT" value={(c)=> Number((c.valor_venda*c.qtd_inv_final).toFixed(2))}/>
                    <ExcelColumn label="CUSTO DIVERG" value={(c)=> Number((c.valor_custo*c.qtd_divergencia).toFixed(2))}/>
                    <ExcelColumn label="VENDA DIVERG" value={(c)=> Number((c.valor_venda*c.qtd_divergencia).toFixed(2))}/>
                </ExcelSheet>
                <ExcelSheet data={this.returnResumoConf.bind(this)} name="Resumo do Confronto">
                    <ExcelColumn label="" value="title"/>
                    <ExcelColumn label="" value="data"/>
                </ExcelSheet>
                <ExcelSheet data={this.returnDiverg.bind(this)} name="Relatório Diverg">
                    <ExcelColumn label="ENDEREÇO" value="enderecamento"/>
                    <ExcelColumn label="DEPARTAMENTO" value="descricao_setor_secao"/>
                    <ExcelColumn label="SETOR" value="setor_secao"/>
                    <ExcelColumn label="COD" value="cod_interno"/>
                    <ExcelColumn label="EAN" value="cod_barra"/>
                    <ExcelColumn label="DESCRIÇÃO" value="descricao_item"/>
                    <ExcelColumn label="QUANT INVENT" value="qtd_inv_final"/>
                    <ExcelColumn label="DIVERG" value="qtd_divergencia"/>
                    <ExcelColumn label="AUDITORIA"/>
                </ExcelSheet>
                <ExcelSheet data={this.returnContagem.bind(this)} name="Relatório da Contagem">
                    <ExcelColumn label="ENDERECO" value="enderecamento"/>
                    <ExcelColumn label="DEPARTAMENTO" value="descricao_setor_secao"/>
                    <ExcelColumn label="SETOR" value="setor_secao"/>
                    <ExcelColumn label="COD" value="cod_interno"/>
                    <ExcelColumn label="EAN" value="cod_barra"/>
                    <ExcelColumn label="LOTE" value="lote"/>
                    <ExcelColumn label="FABRICAÇÃO" value="fabricacao"/>
                    <ExcelColumn label="VALIDADE" value="validade"/>
                    <ExcelColumn label="DESCRIÇÃO" value="descricao_item"/>
                    <ExcelColumn label="QUANT INVENT" value="qtd_inventario"/>
                    <ExcelColumn label="QUANT AUDIT1" value="audit1"/>
                    <ExcelColumn label="QUANT AUDIT2" value="audit2"/>
                    <ExcelColumn label="CONTAGEM FINAL" value="cout_final"/>
                </ExcelSheet>
                <ExcelSheet data={this.returnNaoContados.bind(this)} name="Relatório itens não contados">
                    <ExcelColumn label="DEPARTAMENTO" value="descricao_setor_secao"/>
                    <ExcelColumn label="SETOR" value="setor_secao"/>
                    <ExcelColumn label="COD" value="cod_interno"/>
                    <ExcelColumn label="EAN" value="cod_barra"/>
                    <ExcelColumn label="DESCRIÇÃO" value="descricao_item"/>
                    <ExcelColumn label="REF" value="referencia"/>
                    <ExcelColumn label="SALDO" value="saldo_estoque"/>
                    <ExcelColumn label="QUANT INVENT" value={c=>0}/>
                    <ExcelColumn label="DIVERG" value={c=>c.saldo_estoque*-1}/>
                    <ExcelColumn label="AUD"/>
                </ExcelSheet>
            </ExcelFile>
          </div>
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
            { status ==='diverg' && <BootstrapTable data={divergencia2.filter(d=>d.qtd_inventario!==0)} height='340' scrollTop={ 'Bottom' }
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
              <TableHeaderColumn dataField='cod_barra' editable={ false } width='140' dataSort>EAN  ({divergencia2.filter(d=>d.qtd_inventario!==0).length})</TableHeaderColumn>
              <TableHeaderColumn dataField='enderecamento' editable={ false } width='130' tdStyle={{whiteSpace: 'normal'}} dataSort>Enderecamento</TableHeaderColumn>
              <TableHeaderColumn dataField='descricao_item' editable={ false } tdStyle={{whiteSpace: 'normal'}} dataSort>Descrição</TableHeaderColumn>
              <TableHeaderColumn dataField='validade' editable={ false } width='80' dataSort>Validade</TableHeaderColumn>
              <TableHeaderColumn dataField='lote' editable={ false } width='80' dataSort>Lote</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd_inventario' editable={ false } width='80' dataSort>Coleta</TableHeaderColumn>
              <TableHeaderColumn dataField='saldo_estoque' editable={ false } width='80' dataSort>Saldo</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd_divergencia' editable={ false } width='90' dataSort>Quantidade</TableHeaderColumn>
              <TableHeaderColumn dataField='valor_divergente' editable={ false } width='100' dataSort dataFormat={ (cell, row) =>{
  return `<i class='glyphicon glyphicon-usd'>R$</i> ${cell}`;
} }>Valor</TableHeaderColumn>
            </BootstrapTable>
            }  

            {status ==='audit1' && <BootstrapTable data={divergencia2.filter(d=>d.audit1_selected===true)} height='340' scrollTop={ 'Bottom' }
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
                  Promise.resolve(
                    this.state.divergencia2.map(item => {
                      if(item['id'] === row['id']) {
                        item['audit1'] =  Number(cellValue)
                        qtd_inventario_total += Number(cellValue)
                      } else if (item['base_id'] === row['base_id']){
                        if (item['audit1_selected'])
                          qtd_inventario_total += item['audit1']
                        else
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
                  ).then(div=>{
                    this.setState({divergencia2: div})
                  })
                  return true;
                }
              }}
              selectRow={ selectRowProp } 
              striped search exportCSV
              options={ options }>
              <TableHeaderColumn dataField='id' isKey hidden>ID</TableHeaderColumn>
              <TableHeaderColumn dataField='cod_barra' editable={ false } width='140' dataSort>EAN ({divergencia2.filter(d=>d.audit1_selected===true).length})</TableHeaderColumn>
              <TableHeaderColumn dataField='enderecamento' editable={ false } tdStyle={{whiteSpace: 'normal'}} dataSort>Enderecamento</TableHeaderColumn>
              <TableHeaderColumn dataField='descricao_item' editable={ false } tdStyle={{whiteSpace: 'normal'}} dataSort>Descrição</TableHeaderColumn>
              <TableHeaderColumn dataField='validade' editable={ false } width='80' dataSort>Validade</TableHeaderColumn>
              <TableHeaderColumn dataField='lote' editable={ false } width='80' dataSort>Lote</TableHeaderColumn>
              <TableHeaderColumn dataField='audit1' editable={ false } width='80' dataSort editable={ { validator: jobStatusValidator } }>Coleta</TableHeaderColumn>
              <TableHeaderColumn dataField='saldo_estoque' editable={ false }  width='80' dataSort>Saldo</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd_divergencia' editable={ false } width='90' dataSort>Quantidade</TableHeaderColumn>
              <TableHeaderColumn dataField='valor_divergente' editable={ false } width='100' dataSort dataFormat={ (cell, row) =>{
  return `<i class='glyphicon glyphicon-usd'>R$</i> ${cell}`;
} }>Valor</TableHeaderColumn>
            </BootstrapTable>
            }  

            {status ==='audit2' && <BootstrapTable data={divergencia2.filter(d=>d.audit2_selected===true)} height='340' scrollTop={ 'Bottom' }
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
                  Promise.resolve(
                    this.state.divergencia2.map(item => {
                      if(item['id'] === row['id']) {
                        item['audit2'] =  Number(cellValue)
                        qtd_inventario_total += Number(cellValue)
                      } else if (item['base_id'] === row['base_id']){
                        if (item['audit2_selected'])
                          qtd_inventario_total += item['audit2']
                        else if (item['audit1_selected'])
                          qtd_inventario_total += item['audit1']
                        else
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
                  ).then(div =>{
                    this.setState({divergencia2: div})
                  })
                  return true
                }
              }}
              striped search exportCSV
              options={ options }>
              <TableHeaderColumn dataField='id' isKey hidden>ID</TableHeaderColumn>
              <TableHeaderColumn dataField='cod_barra' editable={ false } width='140' dataSort>EAN ({divergencia2.filter(d=>d.audit2_selected===true).length})</TableHeaderColumn>
              <TableHeaderColumn dataField='enderecamento' editable={ false } tdStyle={{whiteSpace: 'normal'}} dataSort>Enderecamento</TableHeaderColumn>
              <TableHeaderColumn dataField='descricao_item' editable={ false } tdStyle={{whiteSpace: 'normal'}} dataSort>Descrição</TableHeaderColumn>
              <TableHeaderColumn dataField='validade' editable={ false } width='80' dataSort>Validade</TableHeaderColumn>
              <TableHeaderColumn dataField='lote' editable={ false } width='80' dataSort>Lote</TableHeaderColumn>
              <TableHeaderColumn dataField='audit2' width='80' dataSort editable={ { validator: jobStatusValidator } }>Coleta</TableHeaderColumn>
              <TableHeaderColumn dataField='saldo_estoque' editable={ false } width='80' dataSort>Saldo</TableHeaderColumn>
              <TableHeaderColumn dataField='qtd_divergencia' editable={ false } width='90' dataSort>Quantidade</TableHeaderColumn>
              <TableHeaderColumn dataField='valor_divergente' editable={ false } width='100' dataSort dataFormat={ (cell, row) =>{
  return `<i class='glyphicon glyphicon-usd'>R$</i> ${cell}`;
} }>Valor</TableHeaderColumn>
            </BootstrapTable>
            }  
          </Row>
      	</Container>
      <Modal show={this.state.showModal} onHide={this.handleClose.bind(this)} size={'xl'}>
        <Modal.Header closeButton>
          <Modal.Title>Gerar TXT</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <FormControl name='padrao' value={padrao} onChange={this.hendleChangePadrao.bind(this)}
              placeholder="Formato do TXT"
            />
            <InputGroup.Append>
              <Button variant="info" onClick={this.hendleChangeTXT.bind(this)}>Prévia</Button>
            </InputGroup.Append>
          </InputGroup>
          <ButtonToolbar>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='\n'>ENTER</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.descricao_setor_secao}'>DEPARTAMENTO</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.setor_secao}'>SETOR</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.grupo}'>GRUPO</Button>
          
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.familia}'>FAMILIA</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.subfamilia}'>SUBFAMILIA</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.cod_barra}'>EAN</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.referencia}'>REFERENCIA</Button>
            
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.cod_interno}'>COD_INTERNO</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.descricao_item}'>DESCRICAO</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.saldo_estoque}'>SALDO</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.qtd_inventario}'>QUANT_INVENT</Button>
            
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.qtd_divergencia}'>QUANT_DIVERG</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.valor_custo}'>CUSTO</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.valor_venda}'>VENDA</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.valor_custo*d.saldo_estoque}'>CUSTO_SALDO</Button>
            
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.valor_venda*d.saldo_estoque}'>VENDA_SALDO</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.valor_custo*d.qtd_inventario}'>CUSTO_INVENT</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.valor_venda*d.qtd_inventario}'>VENDA_INVENT</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.valor_divergente}'>CUSTO_DIVERG</Button>

            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.valor_venda*d.qtd_divergencia}'>VENDA_DIVERG</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.lote}'>LOTE</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.fabricacao}'>FABRICAÇÃO</Button>
            <Button variant="info" onClick={this.hendleChangePadrao.bind(this)} value='${d.validade}'>VALIDADE</Button>
            </ButtonToolbar><div className="p-2"/>
            <ButtonToolbar><ButtonGroup>
            <Button variant="info" name='ModWinthor' onClick={this.hendleClickModelo.bind(this)}>Sistema Winthor</Button>
            <Button variant="info" name='ModMicrovixLynx' onClick={this.hendleClickModelo.bind(this)}>Microvix Lynx</Button>
            <Button variant="info" name='ModAtivo'onClick={this.hendleClickModelo.bind(this)}>Ativo</Button>
            <Button variant="info" name='ModTropical13' onClick={this.hendleClickModelo.bind(this)}>Ativo tropical(13)</Button>
            <Button variant="info" name='ModTropical14' onClick={this.hendleClickModelo.bind(this)}>Ativo tropical(14)</Button>
            <Button variant="info" name='ModAdicion' onClick={this.hendleClickModelo.bind(this)}>Adicion</Button>
            </ButtonGroup></ButtonToolbar>
          <div className="p-2"/>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>Prévia</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl as="textarea" aria-label="With textarea" value={txt} readOnly/>
          </InputGroup>
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
