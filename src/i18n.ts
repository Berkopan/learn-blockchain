import type { Language, Status } from './types';
const pairs={
atlas:['Explore the atlas','Atlası keşfet'],paths:['Learning paths','Öğrenme yolları'],about:['About','Hakkında'],
eyebrow:['A HANDS-ON ATLAS OF DISTRIBUTED SYSTEMS','DAĞITIK SİSTEMLER İÇİN ETKİLEŞİMLİ BİR ATLAS'],
hero1:['Big ideas.','Büyük fikirler.'],hero2:['Small blocks.','Küçük bloklar.'],
heroText:['Stop a node. Follow a message. See how the pieces work together.','Bir düğümü durdur. Bir mesajı izle. Parçaların nasıl birlikte çalıştığını gör.'],
start:['Build your first block','İlk bloğunu oluştur'],explore:['Find your next “aha.”','Sıradaki “anladım!” anını bul.'],
catalogText:['One idea. A live scene. Your experiment.','Bir fikir. Canlı bir sahne. Senin deneyin.'],
search:['Search an idea, algorithm, or question…','Bir fikir, algoritma veya soru ara…'],
all:['All ideas','Tüm fikirler'],allLevels:['All levels','Tüm seviyeler'],beginner:['Start here','Başlangıç'],intermediate:['Go deeper','Bir adım ileri'],advanced:['Explore further','Derin keşif'],
min:['min','dk'],lesson:['lesson','ders'],lessons:['visual lessons','görsel ders'],lessonsShort:['lessons','ders'],learned:['learned','öğrenildi'],openLesson:['Open lesson','Dersi aç'],
showMore:['Explore more ideas','Daha fazla fikir keşfet'],showAll:['Show all','Tümünü göster'],emptyTitle:['A different way to ask?','Başka bir şekilde arayalım mı?'],
emptyText:['Try “hash”, “time”, or “consensus”. Search works in both languages.','“Hash”, “zaman” veya “uzlaşma” deneyebilirsin. İki dilde de arayabilirsin.'],clear:['Clear filters','Filtreleri temizle'],
pathEyebrow:['A LITTLE DIRECTION','KÜÇÜK BİR YOL HARİTASI'],pathTitle:['Follow your curiosity.','Merakının peşinden git.'],pathText:['A few connected ideas. One bigger picture.','Birbirine bağlı birkaç fikir. Daha büyük bir resim.'],
beginPath:['Begin this path','Bu yola başla'],continue:['Continue','Devam et'],resume:['Pick up where you left off','Kaldığın yerden devam et'],back:['Back to the atlas','Atlasa dön'],
guided:['Watch & learn','İzle ve öğren'],playground:['Playground','Deney alanı'],sources:['Model & sources','Model ve kaynaklar'],share:['Copy lesson link','Ders bağlantısını kopyala'],
copied:['Link copied','Bağlantı kopyalandı'],shareFallback:['Copy the link from your address bar.','Bağlantıyı adres çubuğundan kopyalayabilirsin.'],
step:['Step','Adım'],previous:['Previous step','Önceki adım'],next:['Next step','Sonraki adım'],pause:['Pause','Duraklat'],play:['Play','Oynat'],replay:['Replay','Tekrar oynat'],
reset:['Reset experiment','Deneyi sıfırla'],speed:['Playback speed','Oynatma hızı'],run:['Run experiment','Deneyi çalıştır'],experiment:['YOUR EXPERIMENT','SENİN DENEYİN'],
change:['Change one thing. Watch what follows.','Bir şeyi değiştir. Sonucunu izle.'],inspect:['Look closer','Yakından bak'],inspectHint:['Select an object in the scene or from this list.','Sahneden veya listeden bir nesne seç.'],
objects:['Scene objects','Sahnedeki nesneler'],conclusion:['The idea to keep','Aklında kalsın'],tryNow:['Now make it your experiment','Şimdi kendin dene'],
challenge:['A quick thought','Küçük bir düşünce'],correct:['You got it.','Doğru düşündün.'],incorrect:['Look at the rule again.','Kurala bir daha bakalım.'],
mark:['Mark as learned','Öğrenildi olarak işaretle'],marked:['Added to your progress','İlerlemene eklendi'],nextIdea:['Connect the next idea','Sıradaki fikre bağlan'],
close:['Close','Kapat'],model:['What this model shows','Bu model neyi gösteriyor?'],primarySources:['Read the originals','Özgün kaynakları oku'],
aboutTitle:['Understanding, one block at a time.','Her blokta biraz daha anlamak.'],
aboutText:['Block Atlas is an interactive collection of algorithms, protocols, and concepts from blockchain and distributed systems. Each lesson pairs a small, inspectable model with its primary sources.','Block Atlas, blockchain ve dağıtık sistemlerdeki algoritma, protokol ve kavramlardan oluşan etkileşimli bir koleksiyon. Her ders, incelenebilir küçük bir modeli özgün kaynaklarıyla bir araya getirir.'],
aboutModels:['The models are deliberately small. Their assumptions and boundaries are explained in every lesson. They teach mechanisms; they do not run a production blockchain.','Modeller bilinçli olarak küçük tutulur. Varsayımlar ve sınırlar her derste açıklanır. Amaç, mekanizmaları anlamaktır; üretim ortamında bir blockchain çalıştırmak değildir.'],
motion:['Reduced motion','Hareketi azalt'],motionHint:['Keep every state change, with less movement.','Tüm durum değişimlerini daha az hareketle göster.'],
progress:['Your progress','İlerlemen'],progressHint:['Saved only in this browser. No account needed.','Yalnızca bu tarayıcıda saklanır. Hesap gerekmez.'],resetProgress:['Reset progress','İlerlemeyi sıfırla'],undo:['Undo','Geri al'],
footer:['Small experiments. Deeper understanding.','Küçük deneyler. Daha derin bir anlayış.'],madeFor:['Made for curious minds.','Merak edenler için.'],viewSource:['View source','Kaynak kodu'],
shortcut:['Space to play · ← → to step','Oynat: boşluk · Adım: ← →'],loading:['Putting the pieces together…','Parçalar bir araya geliyor…'],
notFound:['This idea is not in the atlas yet.','Bu fikir henüz atlasta yok.'],errorTitle:['Let’s reset this experiment.','Bu deneyi yeniden başlatalım.'],errorText:['The scene could not load. Reload the page to try again.','Sahne yüklenemedi. Yeniden denemek için sayfayı yenile.'],reload:['Reload','Yenile'],
live:['LIVE NETWORK','CANLI AĞ'],send:['Send a block','Bir blok gönder'],sending:['Following the message…','Mesaj izleniyor…'],heroHint:['Five nodes. One shared story.','Beş düğüm. Ortak bir hikâye.'],
skip:['Skip to content','İçeriğe geç'],up:['Back to top','Başa dön'],language:['Switch to Turkish','İngilizceye geç'],off:['Off','Kapalı'],on:['On','Açık'],
} as const;
export type CopyKey=keyof typeof pairs;
export const t=(language:Language,key:CopyKey):string=>pairs[key][language==='en'?0:1];
export const levelName=(language:Language,level:number):string=>t(language,level===1?'beginner':level===2?'intermediate':'advanced');
export const statusName=(language:Language,status:Status='idle'):string=>({en:{idle:'Waiting',active:'Active',success:'Accepted',warning:'Attention',error:'Rejected',muted:'Inactive'},tr:{idle:'Bekliyor',active:'Etkin',success:'Kabul edildi',warning:'Dikkat',error:'Reddedildi',muted:'Etkin değil'}}[language][status]);
export const kindName=(language:Language,kind:string):string=>({en:{algorithm:'Algorithm',protocol:'Protocol',concept:'Concept','data-structure':'Data structure'},tr:{algorithm:'Algoritma',protocol:'Protokol',concept:'Kavram','data-structure':'Veri yapısı'}}[language][kind as 'algorithm'])||kind;
