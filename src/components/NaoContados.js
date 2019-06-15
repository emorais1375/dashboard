import React from "react";
import ReactExport from "react-data-export";
import mysql from 'mysql';
import env from '../../.env'
import { Button } from "react-bootstrap"

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

export default class NaoContados extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          inventario_id: localStorage.getItem('inv_id') || '',
          inventario_status: localStorage.getItem('inv_status') || '',
          itensNaoContados: []
        }
    }
    componentDidMount(){
        this.gerarItensNaoContados();
    }
    gerarItensNaoContados(){
        let {inventario_id} = this.state;
        let connection = mysql.createConnection(env.config_mysql);
        let query = `
            select 
                descricao_setor_secao, setor_secao, grupo, familia, subfamilia,
                cod_barra, referencia, cod_interno, descricao_item,
                qtd_inventario, qtd_divergente, saldo_estoque
            from(
            select 
                enderecamento, descricao_setor_secao, setor_secao, grupo, familia, subfamilia,
                COALESCE(b.cod_barra, c.cod_barra) cod_barra, referencia, cod_interno, descricao_item,
                COALESCE(saldo_estoque,0) saldo_estoque, COALESCE(qtd_inventario,0) qtd_inventario, valor_custo, valor_venda,
                COALESCE(qtd_inventario,0) - COALESCE(saldo_estoque,0) qtd_divergente,
                TRUNCATE(COALESCE(COALESCE(saldo_estoque,0)*valor_custo,0),2) custo_saldo,
                TRUNCATE(COALESCE(COALESCE(saldo_estoque,0)*valor_venda,0),2) venda_saldo,
                TRUNCATE(COALESCE(COALESCE(qtd_inventario,0)*valor_custo,0),2) custo_inventario,
                TRUNCATE(COALESCE(COALESCE(qtd_inventario,0)*valor_venda,0),2) venda_inventario,
                TRUNCATE(COALESCE((COALESCE(qtd_inventario,0) - COALESCE(saldo_estoque,0))*valor_custo,0),2) custo_divergencia,
                TRUNCATE(COALESCE((COALESCE(qtd_inventario,0) - COALESCE(saldo_estoque,0))*valor_venda,0),2) venda_divergencia
            from 
            (SELECT
                descricao_setor_secao, setor_secao, grupo, familia, subfamilia,
                cod_barra, referencia, cod_interno, descricao_item,
                saldo_estoque, valor_custo, valor_venda
            FROM base where inventario_id=?) b
            LEFT OUTER JOIN
            (
                SELECT
                    cod_barra, SUM(itens_embalagem) qtd_inventario, GROUP_CONCAT(enderecamento) enderecamento
                FROM coleta where inventario_id=? and tipo_coleta = 'INVENTARIO'
                GROUP BY cod_barra
            ) c
            ON b.cod_barra = c.cod_barra
            UNION
            select 
                enderecamento, descricao_setor_secao, setor_secao, grupo, familia, subfamilia,
                COALESCE(b.cod_barra, c.cod_barra) cod_barra, referencia, cod_interno, descricao_item,
                COALESCE(saldo_estoque,0) saldo_estoque, COALESCE(qtd_inventario,0) qtd_inventario, valor_custo, valor_venda,
                COALESCE(qtd_inventario,0) - COALESCE(saldo_estoque,0) qtd_divergente,
                TRUNCATE(COALESCE(COALESCE(saldo_estoque,0)*valor_custo,0),2) custo_saldo,
                TRUNCATE(COALESCE(COALESCE(saldo_estoque,0)*valor_venda,0),2) venda_saldo,
                TRUNCATE(COALESCE(COALESCE(qtd_inventario,0)*valor_custo,0),2) custo_inventario,
                TRUNCATE(COALESCE(COALESCE(qtd_inventario,0)*valor_venda,0),2) venda_inventario,
                TRUNCATE(COALESCE((COALESCE(qtd_inventario,0) - COALESCE(saldo_estoque,0))*valor_custo,0),2) custo_divergencia,
                TRUNCATE(COALESCE((COALESCE(qtd_inventario,0) - COALESCE(saldo_estoque,0))*valor_venda,0),2) venda_divergencia
            from 
            (SELECT
                descricao_setor_secao, setor_secao, grupo, familia, subfamilia,
                cod_barra, referencia, cod_interno, descricao_item,
                saldo_estoque, valor_custo, valor_venda
            FROM base where inventario_id=?) b
            RIGHT OUTER JOIN
            (
                SELECT
                    cod_barra, SUM(itens_embalagem) qtd_inventario, GROUP_CONCAT(enderecamento) enderecamento
                FROM coleta where inventario_id=? and tipo_coleta = 'INVENTARIO' 
                GROUP BY cod_barra
            ) c
            ON b.cod_barra = c.cod_barra) t where qtd_divergente != 0 AND enderecamento is NULL
        `
        connection.query(query, [inventario_id, inventario_id, inventario_id, inventario_id],(error, itensNaoContados, fields) => {
            if(error){
                console.log(error.code,error.fatal)
                return
            }
            this.setState({itensNaoContados})
            connection.end();
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