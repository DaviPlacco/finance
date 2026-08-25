import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "./api";
import { toast } from "sonner";

// Helper for currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
};

// Helper for date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-PT");
};

export const exportToCSV = async () => {
  try {
    const [transactionsRes, categoriesRes] = await Promise.all([
      api.get("/transactions"), // fetches all
      api.get("/categories")
    ]);
    const transactions = transactionsRes.data;
    const categories = categoriesRes.data;

    const categoryMap = new Map(categories.map((c: any) => [c.id, c]));

    let csvContent = "Data,Categoria,Descricao,Tipo,Valor\n";

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t: any) => {
      const category = categoryMap.get(t.category_id);
      const catName = category ? category.name : "Sem Categoria";
      const isIncome = t.type && t.type.toUpperCase() === "INCOME";
      const typeStr = isIncome ? "Receita" : "Despesa";
      const valueStr = t.amount.toString().replace(".", ",");
      
      if (isIncome) totalIncome += t.amount;
      else totalExpense += t.amount;

      const row = `"${formatDate(t.date)}","${catName}","${t.description || ""}","${typeStr}","${valueStr}"`;
      csvContent += row + "\n";
    });

    const balance = totalIncome - totalExpense;
    csvContent += `\n"","","","Total Receitas","${totalIncome.toString().replace(".", ",")}"\n`;
    csvContent += `"","","","Total Despesas","${totalExpense.toString().replace(".", ",")}"\n`;
    csvContent += `"","","","Saldo Total","${balance.toString().replace(".", ",")}"\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PLFinance_Relatorio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    toast.error("Erro ao exportar CSV. Verifica a consola.");
  }
};

export const exportToPDF = async () => {
  try {
    const [transactionsRes, categoriesRes] = await Promise.all([
      api.get("/transactions"), // fetches all
      api.get("/categories")
    ]);
    const transactions = transactionsRes.data;
    const categories = categoriesRes.data;

    const categoryMap = new Map(categories.map((c: any) => [c.id, c]));

    const doc = new jsPDF();

    // Add Logo / Title
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Primary Indigo-600
    doc.text("PL Finance", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Relatório de Transações gerado a ${formatDate(new Date().toISOString())}`, 14, 28);

    const tableColumn = ["Data", "Categoria", "Descrição", "Tipo", "Valor"];
    const tableRows: any[] = [];

    // Colors tracking for specific rows
    const rowColors: any[] = [];

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t: any) => {
      const category = categoryMap.get(t.category_id);
      const catName = category ? category.name : "Sem Categoria";
      const catColorHex = category && category.color ? category.color : "#94a3b8"; // default slate-400
      
      const isIncome = t.type && t.type.toUpperCase() === "INCOME";
      const typeStr = isIncome ? "Receita" : "Despesa";
      const valStr = formatCurrency(t.amount);

      if (isIncome) totalIncome += t.amount;
      else totalExpense += t.amount;

      const rowData = [
        formatDate(t.date),
        catName,
        t.description || "-",
        typeStr,
        valStr
      ];
      
      tableRows.push(rowData);
      rowColors.push({
        catColorHex,
        isIncome
      });
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] }, // slate-800
      alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
      didParseCell: function (data) {
        if (data.section === 'body') {
          const rowIndex = data.row.index;
          const config = rowColors[rowIndex];
          
          // Color the category name column with the category color
          if (data.column.index === 1) {
             data.cell.styles.textColor = config.catColorHex;
             data.cell.styles.fontStyle = 'bold';
          }
          
          // Color the value column green/red
          if (data.column.index === 4) {
             if (config.isIncome) {
                data.cell.styles.textColor = [22, 163, 74]; // green-600
             } else {
                data.cell.styles.textColor = [220, 38, 38]; // red-600
             }
             data.cell.styles.fontStyle = 'bold';
             data.cell.styles.halign = 'right';
          }
        }
      }
    });

    const balance = totalIncome - totalExpense;
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(`Resumo do Relatório`, 14, finalY);
    
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74); // green-600
    doc.text(`Total Receitas: ${formatCurrency(totalIncome)}`, 14, finalY + 8);

    doc.setTextColor(220, 38, 38); // red-600
    doc.text(`Total Despesas: ${formatCurrency(totalExpense)}`, 14, finalY + 14);

    const balanceColor = balance >= 0 ? [22, 163, 74] : [220, 38, 38];
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Saldo Total: ${formatCurrency(balance)}`, 14, finalY + 22);
    doc.setFont("helvetica", "normal");

    doc.save(`PLFinance_Relatorio_${new Date().toISOString().split('T')[0]}.pdf`);

  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    toast.error("Erro ao exportar PDF. Verifica a consola.");
  }
};

export const exportPrevisaoToCSV = (chartData: any[]) => {
  try {
    let csvContent = "Ano,Total Acumulado,Total Investido,Juros Compostos\n";

    chartData.forEach((row) => {
      const ano = row.ano;
      const total = row.Total.toString().replace(".", ",");
      const investido = row.Investido.toString().replace(".", ",");
      const juros = (row.Total - row.Investido).toString().replace(".", ",");
      csvContent += `"${ano}","${total}","${investido}","${juros}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PLFinance_Previsao_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    toast.error("Erro ao exportar CSV. Verifica a consola.");
  }
};

export const exportPrevisaoToPDF = (chartData: any[], results: any, customYears: string) => {
  try {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text("PL Finance", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Previsão Patrimonial gerada a ${formatDate(new Date().toISOString())}`, 14, 28);

    const tableColumn = ["Ano", "Total Acumulado", "Total Investido", "Juros Compostos"];
    const tableRows: any[] = [];

    chartData.forEach((row) => {
      tableRows.push([
        row.ano,
        formatCurrency(row.Total),
        formatCurrency(row.Investido),
        formatCurrency(row.Total - row.Investido)
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Resumo de Metas`, 14, finalY);
    
    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229);
    doc.text(`Em 10 Anos: ${formatCurrency(results.year10)}`, 14, finalY + 8);
    doc.text(`Em 20 Anos: ${formatCurrency(results.year20)}`, 14, finalY + 14);
    doc.text(`Em 30 Anos: ${formatCurrency(results.year30)}`, 14, finalY + 20);
    doc.text(`Meta (${customYears} Anos): ${formatCurrency(results.custom)}`, 14, finalY + 26);

    doc.save(`PLFinance_Previsao_${new Date().toISOString().split('T')[0]}.pdf`);

  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    toast.error("Erro ao exportar PDF. Verifica a consola.");
  }
};

export const exportSimulacaoToCSV = (incomes: any[], expenses: any[]) => {
  try {
    let csvContent = "Tipo,Descrição,Valor\n";
    let totalIncome = 0;
    let totalExpense = 0;

    incomes.forEach((inc) => {
      totalIncome += inc.amount;
      csvContent += `"Receita","${inc.name}","${inc.amount.toString().replace(".", ",")}"\n`;
    });

    expenses.forEach((exp) => {
      totalExpense += exp.amount;
      csvContent += `"Despesa","${exp.name}","${exp.amount.toString().replace(".", ",")}"\n`;
    });

    const balance = totalIncome - totalExpense;
    csvContent += `\n"","Total Receitas","${totalIncome.toString().replace(".", ",")}"\n`;
    csvContent += `"","Total Despesas","${totalExpense.toString().replace(".", ",")}"\n`;
    csvContent += `"","Saldo Previsto","${balance.toString().replace(".", ",")}"\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PLFinance_Simulacao_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    toast.error("Erro ao exportar CSV. Verifica a consola.");
  }
};

export const exportSimulacaoToPDF = (incomes: any[], expenses: any[]) => {
  try {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text("PL Finance", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Simulação Mensal gerada a ${formatDate(new Date().toISOString())}`, 14, 28);

    const tableColumn = ["Tipo", "Descrição", "Valor"];
    const tableRows: any[] = [];
    
    let totalIncome = 0;
    let totalExpense = 0;

    incomes.forEach((inc) => {
      totalIncome += inc.amount;
      tableRows.push(["Receita", inc.name, formatCurrency(inc.amount)]);
    });

    expenses.forEach((exp) => {
      totalExpense += exp.amount;
      tableRows.push(["Despesa", exp.name, formatCurrency(exp.amount)]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 0) {
           if (data.cell.raw === "Receita") {
              data.cell.styles.textColor = [22, 163, 74];
              data.cell.styles.fontStyle = 'bold';
           } else {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
           }
        }
        if (data.section === 'body' && data.column.index === 2) {
           data.cell.styles.halign = 'right';
           const rowArr = data.row.raw as any[];
           if (rowArr[0] === "Receita") {
              data.cell.styles.textColor = [22, 163, 74];
           } else {
              data.cell.styles.textColor = [220, 38, 38];
           }
        }
      }
    });

    const balance = totalIncome - totalExpense;
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Resumo da Simulação`, 14, finalY);
    
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74);
    doc.text(`Total Receitas: ${formatCurrency(totalIncome)}`, 14, finalY + 8);

    doc.setTextColor(220, 38, 38);
    doc.text(`Total Despesas: ${formatCurrency(totalExpense)}`, 14, finalY + 14);

    const balanceColor = balance >= 0 ? [22, 163, 74] : [220, 38, 38];
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Saldo Previsto: ${formatCurrency(balance)}`, 14, finalY + 22);
    doc.setFont("helvetica", "normal");

    doc.save(`PLFinance_Simulacao_${new Date().toISOString().split('T')[0]}.pdf`);

  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    toast.error("Erro ao exportar PDF. Verifica a consola.");
  }
};

export const exportGeneralMonthlyReportPDF = async (year: number, month: number) => {
  try {
    const [transactionsRes, categoriesRes, investmentsRes] = await Promise.all([
      api.get("/transactions"),
      api.get("/categories"),
      api.get("/investments")
    ]);
    
    const allTransactions = transactionsRes.data;
    const categories = categoriesRes.data;
    const investments = investmentsRes.data;

    const categoryMap = new Map(categories.map((c: any) => [c.id, c]));

    // Filtrar transações pelo mês e ano escolhidos
    const filteredTransactions = allTransactions.filter((t: any) => {
      if (!t.date) return false;
      const tDate = new Date(t.date);
      return tDate.getFullYear() === year && (tDate.getMonth() + 1) === month;
    });

    const doc = new jsPDF();

    // Cabeçalho Principal
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text("PL Finance", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Relatório de Fim de Mês - ${month.toString().padStart(2, '0')}/${year}`, 14, 28);

    // Resumo de Transações
    const tableColumn = ["Data", "Categoria", "Descrição", "Tipo", "Valor"];
    const tableRows: any[] = [];
    const rowColors: any[] = [];

    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach((t: any) => {
      const category = categoryMap.get(t.category_id);
      const catName = category ? category.name : "Sem Categoria";
      const catColorHex = category && category.color ? category.color : "#94a3b8";
      
      const isIncome = t.type && t.type.toUpperCase() === "INCOME";
      const typeStr = isIncome ? "Receita" : "Despesa";
      const valStr = formatCurrency(t.amount);

      if (isIncome) totalIncome += t.amount;
      else totalExpense += t.amount;

      tableRows.push([formatDate(t.date), catName, t.description || "-", typeStr, valStr]);
      rowColors.push({ catColorHex, isIncome });
    });

    if (filteredTransactions.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Movimentos do Mês", 14, 40);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: function (data) {
          if (data.section === 'body') {
            const rowIndex = data.row.index;
            const config = rowColors[rowIndex];
            
            if (data.column.index === 1) {
               data.cell.styles.textColor = config.catColorHex;
               data.cell.styles.fontStyle = 'bold';
            }
            if (data.column.index === 4) {
               data.cell.styles.textColor = config.isIncome ? [22, 163, 74] : [220, 38, 38];
               data.cell.styles.fontStyle = 'bold';
               data.cell.styles.halign = 'right';
            }
          }
        }
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Nenhum movimento registado neste mês.", 14, 40);
    }

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 55;
    
    // Resumo Financeiro
    const balance = totalIncome - totalExpense;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("Resumo de Fluxo de Caixa", 14, finalY);
    
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74);
    doc.text(`Total Receitas: ${formatCurrency(totalIncome)}`, 14, finalY + 8);
    doc.setTextColor(220, 38, 38);
    doc.text(`Total Despesas: ${formatCurrency(totalExpense)}`, 14, finalY + 14);

    const balanceColor = balance >= 0 ? [22, 163, 74] : [220, 38, 38];
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Saldo Líquido Mensal: ${formatCurrency(balance)}`, 14, finalY + 22);
    doc.setFont("helvetica", "normal");

    // Secção de Investimentos
    const invY = finalY + 40;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("Posição de Investimentos (Atual)", 14, invY);

    if (investments.length > 0) {
      const invTableColumn = ["Ativo", "Tipo", "Saldo"];
      const invTableRows: any[] = [];
      let totalInv = 0;

      investments.forEach((inv: any) => {
        totalInv += inv.balance;
        invTableRows.push([inv.name, inv.asset_type, formatCurrency(inv.balance)]);
      });

      autoTable(doc, {
        head: [invTableColumn],
        body: invTableRows,
        startY: invY + 5,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 2) {
             data.cell.styles.halign = 'right';
             data.cell.styles.fontStyle = 'bold';
             data.cell.styles.textColor = [0, 82, 255];
          }
        }
      });

      const endInvY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 82, 255);
      doc.text(`Total Património Investido: ${formatCurrency(totalInv)}`, 14, endInvY);
      doc.setFont("helvetica", "normal");
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Sem registos de investimentos.", 14, invY + 10);
    }

    doc.save(`PLFinance_Fecho_Mes_${month.toString().padStart(2, '0')}_${year}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar relatório geral:", error);
    toast.error("Erro ao exportar PDF.");
  }
};
