// app/produtos/page.tsx
import { getItems, Item } from '@/lib/services/item-service';

export default async function ProdutosPage() {
  const produtos = await getItems();
  
  return (
    <div>
      <h1>Produtos</h1>
      {produtos.map((produto: Item) => (  // ← adicione o tipo Item
        <div key={produto.id}>
          <h2>{produto.nome}</h2>
          <p>R$ {produto.valor}</p>
        </div>
      ))}
    </div>
  );
}