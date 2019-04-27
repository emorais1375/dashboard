SELECT 
	CASE
    WHEN base_id IS NULL THEN 'NAO PODE'
    WHEN enderecamento IS NULL  THEN 'NAO PODE'
    ELSE 'NAO' END auditar,
    
	
	
	inventario_id, base_id, enderecamento, cod_barra,
    cod_interno, descricao_item, valor_custo,
    saldo_estoque, qtd_inventario, qtd_divergencia,
    TRUNCATE(valor_custo*qtd_inventario,2) valor_inventario,
    TRUNCATE(valor_custo*saldo_estoque,2) valor_saldo_estoque, 
    TRUNCATE(valor_custo*qtd_divergencia,2) valor_divergencia 
FROM (
          SELECT COALESCE(b.inventario_id, c.inventario_id) inventario_id, b.id base_id, enderecamento, b.cod_barra, b.cod_interno, b.descricao_item,
            COALESCE(b.saldo_estoque, 0) saldo_estoque, COALESCE(c.qtd_inventario, 0) qtd_inventario,
            COALESCE(c.qtd_inventario, 0) - COALESCE(b.saldo_estoque, 0) qtd_divergencia, b.valor_custo
          FROM (
            SELECT id, inventario_id, cod_barra, cod_interno, saldo_estoque, valor_custo, descricao_item
            FROM base 
            WHERE inventario_id = 1
            ) b
          LEFT OUTER JOIN (
            SELECT inventario_id, enderecamento, cod_barra, COUNT(cod_barra) qtd_inventario
            FROM coleta 
            WHERE inventario_id = 1 AND tipo_coleta='INVENTARIO'
            GROUP BY enderecamento, cod_barra
            ) c
          ON b.cod_barra = c.cod_barra
        UNION
          SELECT COALESCE(b.inventario_id, c.inventario_id) inventario_id, b.id base_id, enderecamento, c.cod_barra, b.cod_interno, b.descricao_item,
			COALESCE(b.saldo_estoque, 0) saldo_estoque, COALESCE(c.qtd_inventario, 0) qtd_inventario,
            COALESCE(c.qtd_inventario, 0) - COALESCE(b.saldo_estoque, 0) qtd_divergencia, b.valor_custo
          FROM (
            SELECT id, inventario_id, cod_barra, cod_interno, saldo_estoque, valor_custo, descricao_item 
            FROM base 
            WHERE inventario_id = 1
            ) b
          RIGHT OUTER JOIN (
            SELECT inventario_id, enderecamento, cod_barra, COUNT(cod_barra) qtd_inventario
            FROM coleta 
            WHERE inventario_id = 1 AND tipo_coleta='INVENTARIO'
            GROUP BY enderecamento, cod_barra
            ) c
          ON b.cod_barra = c.cod_barra
        ) A 
        HAVING qtd_divergencia != 0