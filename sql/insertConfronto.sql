-- select * from
-- delete from confronto where inventario_id=1;

-- insert into confronto (inventario_id, base_id, cod_barra, cod_interno, descricao_item, valor_custo, saldo_estoque, qtd_inventario)

select *, t.qtd_inventario-t.saldo_estoque qtd_divergencia, TRUNCATE(t.qtd_inventario*t.valor_custo,2) valor_inventario, TRUNCATE(t.saldo_estoque*t.valor_custo,2) valor_saldo_estoque, IF(TRUNCATE((t.qtd_inventario-t.saldo_estoque)*t.valor_custo,2) < 0,TRUNCATE((t.qtd_inventario-t.saldo_estoque)*t.valor_custo,2)*-1,TRUNCATE((t.qtd_inventario-t.saldo_estoque)*t.valor_custo,2))  valor_divergente from (

select COALESCE(A.inventario_id, B.inventario_id) inventario_id, base_id, COALESCE(A.cod_barra, B.cod_barra) cod_barra, cod_interno, descricao_item, valor_custo, COALESCE(saldo_estoque,0) saldo_estoque, COALESCE(qtd_inventario, 0) qtd_inventario from
(SELECT inventario_id, cod_barra, COUNT(cod_barra) qtd_inventario FROM coleta WHERE inventario_id = 1 AND tipo_coleta='INVENTARIO' GROUP BY cod_barra) A
LEFT OUTER JOIN
(SELECT inventario_id, id base_id, cod_barra, cod_interno, descricao_item, valor_custo, saldo_estoque FROM base WHERE inventario_id = 1) B
ON A.cod_barra = B.cod_barra
UNION
select COALESCE(A.inventario_id, B.inventario_id) inventario_id, base_id, COALESCE(A.cod_barra, B.cod_barra) cod_barra, cod_interno, descricao_item, valor_custo, COALESCE(saldo_estoque,0) saldo_estoque, COALESCE(qtd_inventario, 0) qtd_inventario from
(SELECT inventario_id, cod_barra, COUNT(cod_barra) qtd_inventario FROM coleta WHERE inventario_id = 1 AND tipo_coleta='INVENTARIO' GROUP BY cod_barra) A
RIGHT OUTER JOIN
(SELECT inventario_id, id base_id, cod_barra, cod_interno, descricao_item, valor_custo, saldo_estoque FROM base WHERE inventario_id = 1) B
ON A.cod_barra = B.cod_barra ) t
