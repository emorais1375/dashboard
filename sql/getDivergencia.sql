SELECT *, COALESCE(TRUNCATE(-1*valor_custo*divergencia,2), 0.00) valor FROM (
          SELECT b.id, enderecamento, b.cod, COALESCE(b.qtd, 0) b_qtd, COALESCE(c.qtd, 0) c_qtd,
            COALESCE(c.qtd, 0) - COALESCE(b.qtd, 0) 'divergencia', b.valor_custo
          FROM (
            SELECT id, cod_barra cod, saldo_estoque qtd, valor_custo
            FROM base 
            WHERE inventario_id = 1
            ) b
          LEFT OUTER JOIN (
            SELECT enderecamento, cod_barra cod, COUNT(cod_barra) qtd
            FROM coleta 
            GROUP BY enderecamento, cod_barra
            ) c
          ON b.cod = c.cod
        UNION ALL
          SELECT b.id, enderecamento, c.cod, COALESCE(b.qtd, 0) b_qtd, COALESCE(c.qtd, 0) c_qtd,
            COALESCE(c.qtd, 0) - COALESCE(b.qtd, 0) 'divergencia', b.valor_custo
          FROM (
            SELECT id, cod_barra cod, saldo_estoque qtd, valor_custo 
            FROM base 
            WHERE inventario_id = 1
            ) b
          RIGHT OUTER JOIN (
            SELECT enderecamento, cod_barra cod, COUNT(cod_barra) qtd
            FROM coleta 
            GROUP BY enderecamento, cod_barra
            ) c
          ON b.cod = c.cod
        ) A 
        HAVING divergencia != 0
        LIMIT 10