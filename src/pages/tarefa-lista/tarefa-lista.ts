import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { FirebaseProvider } from '../../providers/firebase/firebase';
import { Storage } from '@ionic/storage';

/**
 * Generated class for the TarefaListaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-tarefa-lista',
  templateUrl: 'tarefa-lista.html',
})
export class TarefaListaPage {
  private listaTarefa = [];
  private usuario = {};
  constructor(
    public navCtrl: NavController,
    public storage: Storage,
    public loadingCtrl: LoadingController,
    public _firebase: FirebaseProvider,
    public navParams: NavParams) {
    let load = loadingCtrl.create({
      content: "Buscado",
      spinner: "ios"
    });
    load.present()
    this.storage.get("usuario").then(res => {
      this.usuario = res;

      if (res.tipo && res.tipo == 4) {
        this._firebase.getAllFilter('chamado', "tipo", "4")
          .subscribe((res: any) => {
            this.ordenacao(res)
          })
      }
      else
        this._firebase.getAll('chamado')
          .subscribe((res: any) => {
            this.ordenacao(res)
          })
      load.dismiss()
    })
  }
  ordenacao(res) {
    this.listaTarefa = res.sort((a, b) => {
      var A = a.status.toLowerCase();
      var B = b.status.toLowerCase();
      if (A < B) {
        return -1;
      } else if (A > B) {
        return 1;
      } else {
        return 0;
      }
    })
    this.listaTarefa.forEach(element => {
      element.porcentagem = this.VerificarPorcentagem(element);
    });
  }
  VerificarPorcentagem(item) {
    var total = item.tarefas.length
    var tarefaFeita = 0
    item.tarefas.forEach(element => {
      if (element.feito)
        tarefaFeita++
    });
    return tarefaFeita / total * 100
  }
  OpenDetalhes(item) {
    switch (item.tipo) {
      case "4":
        this.navCtrl.push("TarefaDetalheCamareiraPage", item)
        break;
      case "5":
        this.navCtrl.push("TarefaDetalheManutencaoPage", item)
        break;
      case "6":
        this.navCtrl.push("TarefaDetalheLavanderiaPage", item)
        break;
      case "7":
        this.navCtrl.push("TarefaDetalheEnfermagemPage", item)
        break;
    }
  }
  OpenPage(item) {
    this.navCtrl.push(item)
  }
}
