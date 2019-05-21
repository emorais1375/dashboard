import React from "react";
import ReactExport from "react-data-export";
import mysql from 'mysql';
import env from '../../.env'

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

export default class Download extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          inventario_id: localStorage.getItem('inv_id') || '',
          inventario_status: localStorage.getItem('inv_status') || '',
          confronto: [],
          rlDivergencia: [],
          itensNaoContados: []
        }
    }
    componentDidMount(){
        this.gerarConfronto();
        this.gerarDivergencia();
        this.gerarItensNaoContados();
    }
    gerarItensNaoContados(){
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
    FROM base) b
    LEFT OUTER JOIN
    (
        SELECT
            cod_barra, SUM(itens_embalagem) qtd_inventario, GROUP_CONCAT(enderecamento) enderecamento
        FROM coleta 
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
    FROM base) b
    RIGHT OUTER JOIN
    (
        SELECT
            cod_barra, SUM(itens_embalagem) qtd_inventario, GROUP_CONCAT(enderecamento) enderecamento
        FROM coleta 
        GROUP BY cod_barra
    ) c
    ON b.cod_barra = c.cod_barra) t where qtd_divergente != 0 AND enderecamento is NULL
        `
        connection.query(query, (error, itensNaoContados, fields) => {
            if(error){
                console.log(error.code,error.fatal)
                return
            }
            this.setState({itensNaoContados})
            connection.end();
        })

    }
    gerarDivergencia(){
        let connection = mysql.createConnection(env.config_mysql);
        let query = `
    select 
        enderecamento, descricao_setor_secao, setor_secao, grupo, familia, subfamilia,
        cod_barra, referencia, cod_interno, descricao_item,
        qtd_inventario, qtd_divergente
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
    FROM base) b
    LEFT OUTER JOIN
    (
        SELECT
            cod_barra, SUM(itens_embalagem) qtd_inventario, GROUP_CONCAT(enderecamento) enderecamento
        FROM coleta 
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
    FROM base) b
    RIGHT OUTER JOIN
    (
        SELECT
            cod_barra, SUM(itens_embalagem) qtd_inventario, GROUP_CONCAT(enderecamento) enderecamento
        FROM coleta 
        GROUP BY cod_barra
    ) c
    ON b.cod_barra = c.cod_barra) t where qtd_divergente != 0 AND enderecamento is not NULL
    
    
        
    
        `
        connection.query(query, (error, rlDivergencia, fields) => {
            if(error){
                console.log(error.code,error.fatal)
                return
            }
            this.setState({rlDivergencia})
            connection.end();
        })
    }
    gerarConfronto(){
        const { inventario_id } = this.state
        let connection = mysql.createConnection(env.config_mysql);
        let query = `
            select 
                descricao_setor_secao, setor_secao, grupo, familia, subfamilia,
                cod_barra, referencia, cod_interno, descricao_item,
                saldo_estoque, qtd_inventario, valor_custo, valor_venda,
                qtd_divergente, custo_saldo, venda_saldo,
                custo_inventario, venda_inventario,
                IF(custo_divergencia<0,custo_divergencia*-1,custo_divergencia) custo_divergencia, 
                IF(venda_divergencia<0,venda_divergencia*-1,venda_divergencia) venda_divergencia
            from(
            select 
                descricao_setor_secao, setor_secao, grupo, familia, subfamilia,
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
                    cod_barra, SUM(itens_embalagem) qtd_inventario
                FROM coleta where inventario_id=?
                GROUP BY cod_barra
            ) c
            ON b.cod_barra = c.cod_barra
            UNION
            select 
                descricao_setor_secao, setor_secao, grupo, familia, subfamilia,
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
                    cod_barra, SUM(itens_embalagem) qtd_inventario
                FROM coleta where inventario_id=? 
                GROUP BY cod_barra
            ) c
            ON b.cod_barra = c.cod_barra) t
            
    
        `
        connection.query(query, [inventario_id, inventario_id, inventario_id, inventario_id], (error, confronto, fields) => {
            if(error){
                console.log(error.code,error.fatal)
                return
            }
            this.setState({confronto})
            console.log(confronto)
            connection.end();
        })
    }
    render() {
        const { confronto, rlDivergencia, itensNaoContados } = this.state
        return (
            <ExcelFile element={<button>Download Data</button>}>
                <ExcelSheet data={confronto} name="Confronto">
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
                    <ExcelColumn label="QUANT INVENT" value="qtd_inventario"/>
                    <ExcelColumn label="CUSTO" value="valor_custo"/>
                    <ExcelColumn label="VENDA" value="valor_venda"/>
                    <ExcelColumn label="DIVERG" value="qtd_divergente"/>
                    <ExcelColumn label="CUSTO SALDO" value="custo_saldo"/>
                    <ExcelColumn label="VENDA SALDO" value="venda_saldo"/>
                    <ExcelColumn label="CUSTO INVENT" value="custo_inventario"/>
                    <ExcelColumn label="VENDA INVENT" value="venda_inventario"/>
                    <ExcelColumn label="CUSTO DIVERG" value="custo_divergencia"/>
                    <ExcelColumn label="VENDA DIVERG" value="venda_divergencia"/>
                </ExcelSheet>
                <ExcelSheet data={rlDivergencia} name="Relatório Diverg">
                    <ExcelColumn label="ENDEREÇO" value="enderecamento"/>
                    <ExcelColumn label="DEPARTAMENTO" value="descricao_setor_secao"/>
                    <ExcelColumn label="SETOR" value="setor_secao"/>
                    <ExcelColumn label="GRUPO" value="grupo"/>
                    <ExcelColumn label="FAMÍLIA" value="familia"/>
                    <ExcelColumn label="SUBFAMILIA" value="subfamilia"/>
                    <ExcelColumn label="EAN" value="cod_barra"/>
                    <ExcelColumn label="REFERÊNCIA" value="referencia"/>
                    <ExcelColumn label="CÓDIGO INTERNO" value="cod_interno"/>
                    <ExcelColumn label="DESCRIÇÃO" value="descricao_item"/>
                    <ExcelColumn label="QUANT INVENT" value="qtd_inventario"/>
                    <ExcelColumn label="DIVERG" value="qtd_divergente"/>
                </ExcelSheet>
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