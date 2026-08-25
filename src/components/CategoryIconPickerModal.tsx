"use client";

import React, { useState, useMemo } from "react";
import { X, Search, Sparkles, Check, Smile, CircleDot } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";

interface CategoryIconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  categoryColor: string;
  currentIcon?: string | null;
  onSelectIcon: (icon: string | null) => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  emojis: { char: string; name: string }[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "popular",
    name: "Populares",
    icon: "🌟",
    emojis: [
      { char: "🍔", name: "hamburguer lanche comida" },
      { char: "🍕", name: "pizza comida restaurante" },
      { char: "🛒", name: "carrinho compras supermercado" },
      { char: "🏠", name: "casa habitacao moradia renda" },
      { char: "🚗", name: "carro automovel veiculo transporte" },
      { char: "⛽", name: "combustivel gasolina abastecimento" },
      { char: "💼", name: "trabalho emprego salario negocios" },
      { char: "💰", name: "dinheiro poupanca patrimonio investimento" },
      { char: "💳", name: "cartao debito credito despesa" },
      { char: "✈️", name: "aviao viagem ferias voo" },
      { char: "🎬", name: "cinema filme entretenimento netflix" },
      { char: "🎮", name: "jogos games lazer ps5" },
      { char: "💊", name: "farmacia remedio saude medicamento" },
      { char: "🎓", name: "universidade faculdade educacao curso" },
      { char: "💈", name: "barbeiro corte cabelo salao beleza" },
      { char: "🏋️", name: "ginasio academia treino fitness" },
      { char: "☕", name: "cafe cafetaria pequeno almoco" },
      { char: "📦", name: "encomenda compras pacote correio" },
    ],
  },
  {
    id: "food",
    name: "Alimentação",
    icon: "🍔",
    emojis: [
      { char: "🍔", name: "hamburguer lanche fast food" },
      { char: "🍕", name: "pizza comida" },
      { char: "🍟", name: "batatas fritas snack" },
      { char: "🌮", name: "taco mexicano comida" },
      { char: "🍜", name: "ramen massa sopa" },
      { char: "🍣", name: "sushi japones peixe" },
      { char: "🥗", name: "salada saudavel vegetais" },
      { char: "🥩", name: "carne bife talho churrasco" },
      { char: "🍗", name: "frango assado comida" },
      { char: "🍞", name: "pao padaria pequeno almoco" },
      { char: "☕", name: "cafe expresso cafetaria" },
      { char: "🍺", name: "cerveja bar bebida" },
      { char: "🍷", name: "vinho adega bebida" },
      { char: "🍹", name: "cocktail drink bar" },
      { char: "🍦", name: "gelado sobremesa doces" },
      { char: "🍩", name: "donuts doce sobremesa" },
      { char: "🍎", name: "maca fruta feira" },
      { char: "🥑", name: "abacate legumes comida" },
      { char: "🛒", name: "supermercado compras continente pingo doce" },
      { char: "🧺", name: "feira compras mercado" },
    ],
  },
  {
    id: "housing",
    name: "Habitação",
    icon: "🏠",
    emojis: [
      { char: "🏠", name: "casa habitacao moradia renda" },
      { char: "🏢", name: "apartamento predio condominio" },
      { char: "🛋️", name: "moveis mobilia decoracao sofa" },
      { char: "💡", name: "luz eletricidade energia conta" },
      { char: "💧", name: "agua saneamento conta" },
      { char: "📶", name: "internet wifi fibra telecomunicacoes" },
      { char: "🔌", name: "eletrodomesticos tomadas gas" },
      { char: "🧹", name: "limpeza faxina manutencao" },
      { char: "🔨", name: "obras reparacao ferramentas" },
      { char: "🪴", name: "jardim plantas horta" },
      { char: "📦", name: "mudanca caixas arrumacao" },
      { char: "🔑", name: "chave seguranca fechadura" },
      { char: "🛏️", name: "quarto cama descanso" },
      { char: "🚿", name: "banho chuveiro casa de banho" },
    ],
  },
  {
    id: "transport",
    name: "Transportes",
    icon: "🚗",
    emojis: [
      { char: "🚗", name: "carro automovel veiculo parcela" },
      { char: "⛽", name: "combustivel gasolina gasoleo abastecimento" },
      { char: "🚌", name: "autocarro passe transporte publico" },
      { char: "🚇", name: "metro comboio bilhete transporte" },
      { char: "🚲", name: "bicicleta ciclovia mobilidade" },
      { char: "🛵", name: "mota scooter entrega" },
      { char: "✈️", name: "aviao viagem voo passagens" },
      { char: "🚖", name: "taxi uber bolt transporte" },
      { char: "🚢", name: "barco cruzeiro ferry" },
      { char: "🅿️", name: "estacionamento parque parquimetro" },
      { char: "🔧", name: "oficina mecanico revisao inspecao" },
      { char: "🧳", name: "bagagem mala viagem hotel" },
      { char: "🗺️", name: "mapa turismo guia" },
      { char: "🛴", name: "trotinete eletrica mobilidade" },
    ],
  },
  {
    id: "finance",
    name: "Finanças & Trabalho",
    icon: "💰",
    emojis: [
      { char: "💰", name: "dinheiro poupanca patrimonio riqueza" },
      { char: "💳", name: "cartao credito debito despesa" },
      { char: "💵", name: "notas dinheiro vivo cash" },
      { char: "🪙", name: "moeda trocos crypto" },
      { char: "🏦", name: "banco conta transferencia" },
      { char: "📈", name: "investimento acoes rendimento lucro" },
      { char: "📉", name: "perdas gastos despesas" },
      { char: "💎", name: "ativo valor luxo joias" },
      { char: "💼", name: "trabalho emprego escritorio salario" },
      { char: "🧾", name: "fatura recibo imposto financas" },
      { char: "📊", name: "relatorio analise estatisticas" },
      { char: "🏷️", name: "desconto cupom taxa comissao" },
      { char: "🤝", name: "negocio contrato parceria" },
      { char: "⚖️", name: "advogado legal taxas judiciais" },
    ],
  },
  {
    id: "leisure",
    name: "Lazer & Estilo",
    icon: "🎮",
    emojis: [
      { char: "🎬", name: "cinema filme streaming netflix disney" },
      { char: "🎮", name: "videojogos consola playstation xbox steam" },
      { char: "⚽", name: "futebol desporto jogo bilhete" },
      { char: "🏋️", name: "ginasio musculacao fitness treino" },
      { char: "🏊", name: "natacao piscina praia" },
      { char: "🚴", name: "ciclismo desporto corrida" },
      { char: "🎨", name: "arte museu exposicao pintura" },
      { char: "🎵", name: "musica spotify concerto espetaculo" },
      { char: "🎧", name: "audio fones podcast" },
      { char: "🎟️", name: "bilhetes ingressos evento festa" },
      { char: "🏖️", name: "praia ferias verao sol" },
      { char: "⛺", name: "campismo natureza aventura" },
      { char: "🎳", name: "bowling jogos diversao" },
      { char: "🎾", name: "tenis padel desporto" },
      { char: "🛍️", name: "compras shopping vestuario moda" },
      { char: "👗", name: "roupa vestidos calcado zara" },
    ],
  },
  {
    id: "health",
    name: "Saúde & Cuidados",
    icon: "💊",
    emojis: [
      { char: "💊", name: "medicamentos farmacia remedios" },
      { char: "🏥", name: "hospital clinica emergencia" },
      { char: "🩺", name: "consulta medico especialista" },
      { char: "💈", name: "barbeiro cabeleireiro barba corte" },
      { char: "💅", name: "unhas manicure estetica" },
      { char: "🧴", name: "cosmeticos cremes skincare cuidados" },
      { char: "🧘", name: "yoga meditacao bem-estar mental" },
      { char: "👓", name: "oculos otica visao oftalmologista" },
      { char: "🦷", name: "dentista dentes ortodontia" },
      { char: "🩹", name: "primeiros socorros curativos" },
      { char: "🌿", name: "suplementos natural vitaminas" },
    ],
  },
  {
    id: "tech_edu",
    name: "Tecnologia & Educação",
    icon: "🎓",
    emojis: [
      { char: "🎓", name: "universidade faculdade diploma graduacao" },
      { char: "📚", name: "livros leitura biblioteca curso" },
      { char: "💻", name: "computador portatil software ti" },
      { char: "📱", name: "telemovel smartphone aplicacao apple" },
      { char: "🖥️", name: "monitor hardware setup" },
      { char: "📷", name: "fotografia camera video" },
      { char: "⌚", name: "smartwatch relogio gadgets" },
      { char: "🤖", name: "inteligencia artificial bot tecnologia" },
      { char: "📝", name: "anotacoes estudos caderno papelaria" },
      { char: "✏️", name: "material escolar lapis caneta" },
    ],
  },
];

export function CategoryIconPickerModal({
  isOpen,
  onClose,
  categoryName,
  categoryColor,
  currentIcon,
  onSelectIcon,
}: CategoryIconPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("popular");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(
    currentIcon && currentIcon !== "dot" ? currentIcon : null
  );

  // Filtered Emojis
  const filteredEmojis = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase().trim();
    const matches: { char: string; name: string }[] = [];
    const seen = new Set<string>();

    EMOJI_CATEGORIES.forEach((cat) => {
      cat.emojis.forEach((e) => {
        if (
          (e.char.includes(term) || e.name.toLowerCase().includes(term)) &&
          !seen.has(e.char)
        ) {
          seen.add(e.char);
          matches.push(e);
        }
      });
    });

    return matches;
  }, [searchTerm]);

  if (!isOpen) return null;

  const handleSelectEmoji = (emojiChar: string) => {
    setSelectedEmoji(emojiChar);
  };

  const handleDoubleClickEmoji = (emojiChar: string) => {
    setSelectedEmoji(emojiChar);
    onSelectIcon(emojiChar);
  };

  const handleSave = () => {
    onSelectIcon(selectedEmoji);
  };

  const handleRemoveIcon = () => {
    setSelectedEmoji(null);
    onSelectIcon(null);
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform"
              style={{ backgroundColor: categoryColor }}
            >
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Ícone da Categoria
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personaliza como <strong className="text-slate-800 dark:text-slate-200">&quot;{categoryName}&quot;</strong> é apresentada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="px-5 py-3.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CategoryIcon
              color={categoryColor}
              icon={selectedEmoji}
              size="md"
            />
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Pré-visualização
              </span>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                {categoryName}
              </span>
            </div>
          </div>

          {/* Quick Clear / Use Solid Dot Button */}
          <button
            type="button"
            onClick={() => setSelectedEmoji(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              !selectedEmoji
                ? "bg-primary text-white border-primary shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/50"
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>Usar Bolinha</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar ícones (ex: carro, pizza, supermercado)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Categories Tabs (if not searching) */}
        {!searchTerm && (
          <div className="flex gap-1.5 px-4 pt-3 pb-1 overflow-x-auto [scrollbar-width:none] border-b border-slate-100 dark:border-slate-800 shrink-0">
            {EMOJI_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === cat.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Emojis Grid */}
        <div className="p-4 overflow-y-auto max-h-[340px] [scrollbar-width:thin] flex-1">
          {filteredEmojis ? (
            filteredEmojis.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Nenhum ícone encontrado para &quot;{searchTerm}&quot;.
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5">
                {filteredEmojis.map((item, idx) => {
                  const isSelected = selectedEmoji === item.char;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectEmoji(item.char)}
                      onDoubleClick={() => handleDoubleClickEmoji(item.char)}
                      className={`h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 relative group active:scale-95 ${
                        isSelected
                          ? "bg-primary/20 border-2 border-primary scale-105 shadow-md ring-2 ring-primary/20"
                          : "bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 hover:shadow-md"
                      }`}
                      title={`${item.name} (Clique para pré-visualizar, duplo clique para guardar)`}
                    >
                      <span className="select-none">{item.char}</span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div>
              {EMOJI_CATEGORIES.filter((cat) => cat.id === activeTab).map((cat) => (
                <div key={cat.id} className="grid grid-cols-6 sm:grid-cols-8 gap-2.5">
                  {cat.emojis.map((item, idx) => {
                    const isSelected = selectedEmoji === item.char;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectEmoji(item.char)}
                        onDoubleClick={() => handleDoubleClickEmoji(item.char)}
                        className={`h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 relative group active:scale-95 ${
                          isSelected
                            ? "bg-primary/20 border-2 border-primary scale-105 shadow-md ring-2 ring-primary/20"
                            : "bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 hover:shadow-md"
                        }`}
                        title={`${item.name} (Clique para pré-visualizar, duplo clique para guardar)`}
                      >
                        <span className="select-none">{item.char}</span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70 gap-2">
          <button
            type="button"
            onClick={handleRemoveIcon}
            className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Remover Ícone
          </button>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-md shadow-primary/25 flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Ícone</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
