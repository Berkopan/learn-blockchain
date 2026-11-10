# Block Atlas

### Blockchain ve dağıtık sistemleri hareket hâlinde keşfet.

**85 görsel ders · 8 kategori · 5 öğrenme yolu · Türkçe / English**

Mesajların düğümler arasında ilerleyişini izle, bir bloğun zincire eklenmesini takip et ve bir katılımcı devre dışı kaldığında nelerin değiştiğini gör. Block Atlas, algoritmaları küçük ve etkileşimli sahnelere dönüştürür: önce kısa bir anlatım, ardından kontrolün sende olduğu bir simülasyon.

[English](README.md) · [Mimari](docs/architecture.md) · [Doğrulama kaydı](docs/validation.md)

## Sistemi değiştirerek öğren

- **Mekanizmayı gör.** Gerçek 3D sahnenin etrafında dön, düğümleri ve blokları incele, anlatımda adım adım ilerle.
- **Bir senaryo dene.** Derse göre gecikme, arıza, oy, veri parçası veya ortak işlem sayısı gibi girdileri değiştir. Oluşan durumu sahnede gör.
- **Görünümünü seç.** WebGL görünümünü Three.js çizer. WebGL kullanılamadığında aynı dünya koordinatlarını yansıtan yazılımsal 3D görünüm devreye girer. Ayrıca düz bir 2D şema da seçebilirsin.
- **Kaldığın yerden devam et.** Katalogda ara, filtrele ve bir öğrenme yolunu takip et. İlerlemen tarayıcında saklanır.
- **Kaynağa ulaş.** Her derste birincil kaynaklar, modelin sınırları ve küçük bir görev bulunur. Arayüz ve dersler Türkçe ile İngilizceyi destekler.

## Geniş bir kütüphane, kısa dersler

| Kategori | Keşfedebileceğin bazı konular |
| --- | --- |
| Temeller | Hash bağlantıları, Merkle ağaçları, işlemler ve zincir yapısı |
| Uzlaşma | Proof of Work, Raft, Bizans uzlaşması ve örneklemeli uzlaşma |
| Koordinasyon | Lider seçimi, atomik işlem tamamlama ve dağıtık anlık görüntüler |
| Zaman | Mantıksal saatler, vektör saatleri, HLC, NTP ve sınırlı belirsizlik |
| Ağ | Gossip, yönlendirme, compact block ve işlem kümelerinin uzlaştırılması |
| Depolama | Çoğaltma, CRDT'ler, Bloom filtreleri ve silinme kodları |
| Ölçekleme | Veri erişilebilirliği, DAG'ler ve modüler yürütme |
| Kriptografi | Taahhütler, ispatlar ve doğrulanabilir gecikme |

Her biri altı dersi bir araya getiren beş öğrenme yolu var:

**İlk bloğun** · **Düğümler nasıl anlaşır?** · **İşler ters gittiğinde** · **Bağlantılar dünyası** · **Blockchain'in ötesinde**

Bir öğrenme yoluyla başla veya doğrudan merak ettiğin konuya git. Ana ekrandaki anlatımlar kısadır; daha fazlasını öğrenmek istediğinde nesne ayrıntılarını ve kaynak notlarını açabilirsin.

## Yerelde çalıştır

**Node.js 24** ve npm kullan.

```bash
npm ci
npm run dev
```

Vite'ın terminalde gösterdiği yerel adresi aç.

```bash
npm test
npm run build
npm run preview
```

Üretim çıktısı `dist/` klasörüne yazılır. Uygulama, göreli dosya yolları ve hash tabanlı ders adresleri kullanır; böylece statik bir sunucunun alt dizininde de çalışabilir.

## İncelenebilir bir yapı

Uygulama React, TypeScript, Vite ve Three.js ile geliştirilmiştir. Ders içeriği, deterministik simülasyon fonksiyonlarından ayrıdır; bütün görünümler aynı durum karelerini kullanır. Hesap, sunucu, cüzdan veya canlı blockchain bağlantısı gerekmez.

Simülasyonlar, öğretmek için küçük tutulmuş modellerdir. Varsayımları her derste belirtilir: örnek amaçlı kriptografik hesaplamalar açıkça tanımlanır ve bir protokolün sınırlı bir bölümü gösterildiğinde bu sınır açıklanır.

- [Mimari ve yeni ders ekleme rehberi](docs/architecture.md)
- [Doğrulama durumu ve kabul ölçütleri](docs/validation.md)
- [Blockchain araştırma notları](docs/research-blockchain.md)
- [Dağıtık sistemler araştırma notları](docs/research-distributed.md)
- [İleri konular araştırma notları](docs/research-advanced.md)

Yeni bir ders eklerken iki dili, birincil kaynakları, sonucu değiştiren kontrolleri, modelin açık sınırlarını ve öğretilen mekanizmayı doğrulayan testleri birlikte ekle.
