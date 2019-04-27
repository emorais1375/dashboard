-- INVENTÁRIO ADIDAS SHOPPING PONTA NEGRA

INSERT INTO base
    (id, inventario_id, cod_barra, referencia, descricao_item, saldo_estoque)
SELECT * FROM (
	SELECT id, inventario_id, cod_barra, referencia, descricao_item, saldo_estoque FROM base 
	WHERE EXISTS (
		SELECT 1 FROM base WHERE inventario_id=1 AND cod_barra='4059807143744' LIMIT 1
    ) AND cod_barra='4059807143744' AND inventario_id=1
    UNION
    SELECT 0 id, 1 inventario_id, '4059807143744' cod_barra, 'DJ2721' referencia,
		'CAMISA FLAMENGO II CWHITE/HIRERE/CARBON L' descricao_item, 27 saldo_estoque 
	WHERE NOT EXISTS (
		SELECT 1 FROM base WHERE inventario_id=1 AND cod_barra='4059807143744' LIMIT 1
    )
) AS dt
ON DUPLICATE KEY UPDATE saldo_estoque = VALUES(saldo_estoque) + 1

-- (1, '4059807143744', 'DJ2721', 'CAMISA FLAMENGO II CWHITE/HIRERE/CARBON L', 27)