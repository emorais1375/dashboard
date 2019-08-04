import React from "react";
import ReactExport from "react-data-export";
import { Button } from "react-bootstrap"
import { ipcRenderer } from "electron";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

export default class NaoContados extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          itensNaoContados: [],
          base: [],
          coleta: []
        }
    }
    componentDidMount(){
        this.getBase().then(()=>{
          this.getColeta().then(()=>{
            this.createItensNaoContados()
          },(code, fatal)=>{
            alert('Erro ao ler a coleta: '+code+fatal)
          })
        },(code, fatal)=>{
          alert('Erro ao ler a base: '+code+fatal)
        })
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
              b['qtd_inventario'] = 0
              b['qtd_divergente'] = b['saldo_qtd_estoque'] * -1
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
                'fabricacao': col.fabricacao
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
    createItensNaoContados(){
        const { base, coleta } = this.state
        Promise.resolve(
            base.filter(b => !coleta.map(c=>c.cod_barra).includes(b.cod_barra))
        ).then((itensNaoContados)=>{
            this.setState({itensNaoContados})
        })
    }
    render() {
        const { itensNaoContados } = this.state
        return (
            <ExcelFile
                filename="rl_itensNaoContados"
                element={<Button variant="info">Baixar itens não contados</Button>}>
                <ExcelSheet data={itensNaoContados} name="Relatório itens não contados">
                    <ExcelColumn label="DEPARTAMENTO" value="descricao_setor_secao"/>
                    <ExcelColumn label="SETOR" value="setor_secao"/>
                    <ExcelColumn label="COD" value="cod_interno"/>
                    <ExcelColumn label="EAN" value="cod_barra"/>
                    <ExcelColumn label="DESCRIÇÃO" value="descricao_item"/>
                    <ExcelColumn label="REF" value="referencia"/>
                    <ExcelColumn label="SALDO" value="saldo_estoque"/>
                    <ExcelColumn label="QUANT INVENT" value="qtd_inventario"/>
                    <ExcelColumn label="DIVERG" value="qtd_divergente"/>
                </ExcelSheet>
            </ExcelFile>
        );
    }
}