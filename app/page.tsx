"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Tag,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Brain,
} from "lucide-react";

// Types and Interfaces
interface CategoryData {
  category: string;
  count: number;
}

interface LearnedCategories {
  [key: string]: CategoryData;
}

interface CategoryRules {
  [key: string]: string;
}

interface ClassificationResult {
  category: string;
  confidence: number;
  method: "learned" | "rule_based" | "too_short" | "no_match";
}

// Basitleştirilmiş ProductCategoryClassifier (React component içinde)
class ProductCategoryClassifier {
  private categoryRules: CategoryRules;
  private learnedCategories: LearnedCategories;

  constructor() {
    this.categoryRules = {
      "iphone|samsung|xiaomi|huawei|telefon|phone": "Elektronik > Cep Telefonu",
      "macbook|laptop|bilgisayar|computer|pc": "Elektronik > Bilgisayar",
      "ipad|tablet": "Elektronik > Tablet",
      "playstation|xbox|konsol|ps5": "Elektronik > Oyun Konsolu",
      "airpods|kulaklık|headphone": "Elektronik > Ses Sistemleri",
      "tişört|t-shirt|gömlek": "Giyim > Üst Giyim",
      "pantolon|jean|şort": "Giyim > Alt Giyim",
      "ayakkabı|nike|adidas|bot": "Giyim > Ayakkabı",
      "çanta|bag|sırt çantası": "Giyim > Çanta & Aksesuar",
      "masa|sandalye|koltuk": "Ev & Bahçe > Mobilya",
      "kitap|roman|dergi": "Kitap & Medya",
      "araba|bmw|mercedes|audi": "Otomotiv",
    };

    this.learnedCategories = JSON.parse(
      localStorage.getItem("learnedCategories") || "{}"
    );
  }

  async classifyProduct(productName: string): Promise<ClassificationResult> {
    if (!productName || productName.trim().length < 2) {
      return { category: "Genel", confidence: 0.1, method: "too_short" };
    }

    const cleanName = productName.toLowerCase().trim();

    // Öğrenilen kategorilerden kontrol
    const words = cleanName.split(" ");
    for (const word of words) {
      if (this.learnedCategories[word]) {
        const data = this.learnedCategories[word];
        const confidence = Math.min(0.95, data.count * 0.15 + 0.6);
        return { category: data.category, confidence, method: "learned" };
      }
    }

    // Kural tabanlı kontrol
    for (const [keywords, category] of Object.entries(this.categoryRules)) {
      const keywordList = keywords.split("|");
      for (const keyword of keywordList) {
        if (cleanName.includes(keyword)) {
          const confidence = cleanName === keyword ? 0.9 : 0.7;
          return { category, confidence, method: "rule_based" };
        }
      }
    }

    return { category: "Genel", confidence: 0.1, method: "no_match" };
  }

  learnFromUserSelection(productName: string, selectedCategory: string): void {
    const words = productName.toLowerCase().split(" ");
    words.forEach((word) => {
      if (word.length > 2) {
        if (!this.learnedCategories[word]) {
          this.learnedCategories[word] = {
            category: selectedCategory,
            count: 1,
          };
        } else if (this.learnedCategories[word].category === selectedCategory) {
          this.learnedCategories[word].count++;
        }
      }
    });
    localStorage.setItem(
      "learnedCategories",
      JSON.stringify(this.learnedCategories)
    );
  }

  getLearnedCategoriesCount(): number {
    return Object.keys(this.learnedCategories).length;
  }
}

const ProductAddForm = () => {
  const [productName, setProductName] = useState<string>("");
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [classifier] = useState(() => new ProductCategoryClassifier());
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);

  const allCategories = [
    "Elektronik > Cep Telefonu",
    "Elektronik > Bilgisayar",
    "Elektronik > Tablet",
    "Elektronik > Oyun Konsolu",
    "Elektronik > Ses Sistemleri",
    "Elektronik > Televizyon",
    "Giyim > Üst Giyim",
    "Giyim > Alt Giyim",
    "Giyim > Ayakkabı",
    "Giyim > Çanta & Aksesuar",
    "Ev & Bahçe > Mobilya",
    "Ev & Bahçe > Dekorasyon",
    "Spor > Fitness",
    "Spor > Outdoor",
    "Kitap & Medya",
    "Otomotiv",
    "Sağlık & Kozmetik",
    "Genel",
  ];

  // Ürün adı değiştiğinde kategori öner
  useEffect(() => {
    const classifyProduct = async () => {
      if (productName.length > 2) {
        setIsClassifying(true);

        // Gerçek uygulamada debounce kullanın
        const result = await classifier.classifyProduct(productName);

        setSuggestedCategory(result.category);
        setConfidence(result.confidence);

        // Yüksek güven skoru varsa otomatik seç
        if (result.confidence > 0.7) {
          setSelectedCategory(result.category);
        }

        setIsClassifying(false);
      } else {
        setSuggestedCategory(null);
        setConfidence(0);
      }
    };

    const timer = setTimeout(classifyProduct, 300); // Debounce
    return () => clearTimeout(timer);
  }, [productName, classifier]);

  const handleCategorySelection = (category: string): void => {
    setSelectedCategory(category);

    // Eğer önerilen kategoriden farklı seçildiyse, sisteme öğret
    if (suggestedCategory && category !== suggestedCategory && productName) {
      classifier.learnFromUserSelection(productName, category);
    }
  };

  const getConfidenceColor = (conf: number): string => {
    if (conf > 0.7) return "text-green-600";
    if (conf > 0.4) return "text-yellow-600";
    return "text-red-600";
  };

  const getMethodIcon = (method: ClassificationResult["method"]) => {
    switch (method) {
      case "learned":
        return <Brain className="w-4 h-4 text-purple-500" />;
      case "rule_based":
        return <Tag className="w-4 h-4 text-blue-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Ürün Ekle</h2>

      {/* Ürün Adı Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ürün Adı
        </label>
        <div className="relative">
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Örn: iPhone 14 Pro, Samsung Galaxy S23..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {isClassifying && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {/* Önerilen Kategori */}
      {suggestedCategory && !isClassifying && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                Önerilen Kategori
              </span>
              {getMethodIcon("rule_based")}
            </div>
            <span
              className={`text-sm font-medium ${getConfidenceColor(
                confidence
              )}`}
            >
              {(confidence * 100).toFixed(1)}% güven
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
              {suggestedCategory}
            </span>
            <button
              onClick={() => handleCategorySelection(suggestedCategory)}
              className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Kabul Et
            </button>
          </div>
        </div>
      )}

      {/* Kategori Seçimi */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kategori Seçimi
        </label>

        {selectedCategory ? (
          <div className="flex items-center gap-3 mb-3">
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
              {selectedCategory}
            </span>
            <button
              onClick={() => setSelectedCategory("")}
              className="text-gray-500 hover:text-gray-700"
            >
              Değiştir
            </button>
          </div>
        ) : (
          <div className="text-gray-500 mb-3">Kategori seçilmedi</div>
        )}

        <button
          onClick={() => setShowAllCategories(!showAllCategories)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
        >
          <TrendingUp className="w-4 h-4" />
          {showAllCategories ? "Kategorileri Gizle" : "Tüm Kategorileri Göster"}
        </button>

        {showAllCategories && (
          <div className="mt-4 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelection(category)}
                className="text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm transition-colors"
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Diğer Form Alanları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Başlangıç Fiyatı (₺)
          </label>
          <input
            type="number"
            placeholder="100"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Açık Artırma Süresi
          </label>
          <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="1">1 Gün</option>
            <option value="3">3 Gün</option>
            <option value="7">1 Hafta</option>
            <option value="14">2 Hafta</option>
          </select>
        </div>
      </div>

      {/* Ürün Açıklaması */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ürün Açıklaması
        </label>
        <textarea
          rows={4}
          placeholder="Ürününüzün detaylı açıklamasını yazın..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      {/* Ürün Görselleri */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ürün Görselleri
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <div className="text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2">
              Fotoğrafları sürükleyip bırakın veya tıklayın
            </p>
            <p className="text-sm text-gray-400">PNG, JPG, GIF (max. 10MB)</p>
          </div>
        </div>
      </div>

      {/* Sistem Durumu */}
      {productName && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Sistem Durumu</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>
                Öğrenilen kelime sayısı:{" "}
                {classifier.getLearnedCategoriesCount()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span>
                Kategori tahmin doğruluğu:{" "}
                {confidence > 0
                  ? `${(confidence * 100).toFixed(1)}%`
                  : "Henüz tahmin yok"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gönder Butonu */}
      <div className="flex gap-4">
        <button
          type="button"
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          disabled={!productName || !selectedCategory}
        >
          Açık Artırmayı Başlat
        </button>

        <button
          type="button"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Taslak Kaydet
        </button>
      </div>

      {/* Kullanım İpuçları */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-medium text-yellow-800 mb-2">💡 İpuçları</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>
            • Ürün adını ne kadar detaylı yazarsanız, kategori tahmini o kadar
            doğru olur
          </li>
          <li>
            • Sistem seçimlerinizden öğrenir ve gelecekte daha iyi tahminler
            yapar
          </li>
          <li>
            • Önerilen kategori yanlışsa, doğru kategoriyi seçerek sistemi
            eğitebilirsiniz
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ProductAddForm;
