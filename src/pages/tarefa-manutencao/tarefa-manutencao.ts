import { Component, Input, ViewChild } from '@angular/core';
import { IonicPage, NavController, Slides, NavParams, AlertController, LoadingController, ActionSheetController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { FirebaseProvider } from '../../providers/firebase/firebase';
import { ToastProvider } from '../../providers/toast/toast';
import { CameraProvider } from '../../providers/camera/camera';
import { DomSanitizer } from '@angular/platform-browser';
import { Tarefa } from '../../models/Tarefa';
import { TabsPage } from '../tabs/tabs';

@IonicPage()
@Component({
  selector: 'page-tarefa-manutencao',
  templateUrl: 'tarefa-manutencao.html',
})
export class TarefaManutencaoPage {
  @ViewChild(Slides) slides: Slides;
  @ViewChild('fileInput') fileInput;

  chamado: any = {};
  servico: any = [];
  imagens = [];
  tarefa: Array<Tarefa>
  tipo = "eletrica";
  galleryApp = [];
  constructor(
    private Dom: DomSanitizer,
    public navCtrl: NavController,
    public actionSheetCtrl: ActionSheetController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public storage: Storage,
    public _toast: ToastProvider,
    public _camera: CameraProvider,
    public _firebase: FirebaseProvider,
    public navParams: NavParams) {
    this.chamado.urgente = false;
    this.imagens = [];
  }

  ionViewDidLoad() {
    let load = this.loadingCtrl.create({
      content:"Buscando",
      spinner:"ios"
    });
    load.present();
    this._firebase.getServico(5).subscribe((res: any) => {
      this.servico = res;
      load.dismiss();
    })
    this.AdicionarNumeroQuarto()
    this.slides.lockSwipes(true)
  }
  AdicionarNumeroQuarto() {
    let alert = this.alertCtrl.create({
      title: 'Atenção',
      message: "Informe o numero do quarto!",
      inputs: [
        {
          name: 'quarto',
          placeholder: 'Nº Quarto',
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          handler: data => {
            this.navCtrl.setRoot(TabsPage)
          }
        },
        {
          text: 'Adicionar',
          handler: data => {
            if (data.quarto == "") {
              this.AdicionarNumeroQuarto()
            }
            else {
              this.servico.apartamento = data.quarto
            }
          }
        }
      ]
    });
    alert.present()
  }
  ControlSlide(tipo) {
    this.slides.lockSwipes(false)
    if (tipo == 1) {
      this.slides.slideNext(1000)
    }
    else
      this.slides.slidePrev(1000)
    this.slides.lockSwipes(true)
  }
  enviar() {
    let load = this.loadingCtrl.create({
      content:"Salvando",
      spinner:"ios"
    });
    load.present();
    let all = [];
    this.imagens.forEach(element => {
      all.push(this.updateImagem(element))
    });
    Promise.all(all).then(res => {
      this.chamado.imagens = res;
      this.chamado.tipo = "2";
      this.chamado.status = "1"
      this.chamado.datacadastro = new Date()
      this.chamado.checkin = null
      this.chamado.checkout = null
      this.chamado.tarefas = [];
      let aux: any = {};
      this.servico.forEach(element => {
        if (element.ativo) {
          aux = {};
          aux.feito = false;
          aux.servicoId = element.$key;
          aux.titulo = element.titulo;
          this.chamado.tarefas.push(aux)
        }
      });
      this.storage.get("usuario").then(res => {
        this.chamado.user = res.$key;
        this._firebase.save("chamado", this.chamado).then(res => {
          this.navCtrl.setRoot(TabsPage)
          load.dismiss();
        })
      })
    })
  }
  verifica() {
    let r = false;
    switch (this.slides._activeIndex) {
      case 0:
        r = (this.servico.length > 0 && this.servico.find(x => x.ativo) != null) || (this.chamado.outra && this.chamado.outra != '')
        break;
      default:
        r = true
        break;
    }
    return r;
  }
  deleteImagem(item) {
    {
      let alert = this.alertCtrl.create({
        message: 'Deseja excluir a imagem ?',
        buttons: [{ text: 'Não', },
        { text: 'Sim', handler: () => { this.imagens.splice(this.chamado.imagens.indexOf(item), 1); } }
        ]
      });
      alert.present();
    }
  }
  getImage() {
    const actionSheet = this.actionSheetCtrl.create({
      title: 'Selecione',
      buttons: [
        {
          text: 'Camera', handler: () => {
            this._camera.getPicture('Camera', 400).then((res: any) => {
              this.imagens.push(res)
            }).catch(() => { this.fileInput.nativeElement.click(); })
          }
        },
        {
          text: 'Galeria', handler: () => {
            this._camera.getPicture('FotoPerfil', 400).then((res: any) => {
              this.imagens.push(res)
            }).catch(() => { this.fileInput.nativeElement.click(); })
          }
        },
        { text: 'Cancelar', role: 'cancel', handler: () => { } }
      ]
    });
    actionSheet.present();
  }
  updateImagem(imagem) {
    return new Promise<any>((resolve, reject) => {
      let date = new Date();
      let month = date.getMonth() + 1;
      let idGenerator = date.getDate().toString() + month.toString() + date.getFullYear().toString() + date.getHours().toString()
        + date.getMinutes().toString() + date.getSeconds().toString() + date.getMilliseconds().toString();

      this._camera.uploadPhoto(imagem, idGenerator, "manutencao/")
        .then((savedPicture) => {
          imagem = savedPicture;
          resolve(savedPicture)
        }).catch((error) => {
          console.log(error)
          reject()
        })
    })
  }
  processWebImage(event) {
    let reader = new FileReader();
    reader.onload = (readerEvent) => {
      let imageData = (readerEvent.target as any).result;
      // this.updateImagem(imageData).then(res=>{})
      this.imagens.push(imageData)
    };
    if (event.target.files.length > 0)
      reader.readAsDataURL(event.target.files[0]);
  }
  ativos(tipo) {
    return this.servico.find(x => x.ativo && x.tipoServico == tipo)
  }
}
