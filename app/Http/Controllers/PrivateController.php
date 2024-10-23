<?php
namespace App\Http\Controllers;

/*
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Tools;


class PrivateController extends Controller
{
    /*---------*/
    /* Accueil */
    /*---------*/
    /**
     * Affiche la page d'accueil
     */
    public function accueil()
    {
        LogController::addLog('Affichage de la page d\'accueil privée');

        $tools = Tools::all()->where('user_id', Auth::id())->sortBy('position');
        return view('private.accueil', compact('tools'));
    }

    /*--------------------*/
    /* Gestion des outils */
    /*--------------------*/
    /**
     * Ajouter un outil
     */
    public function addTool(Request $request)
    {
        /* Validation des informations du formulaire */
        $request->validate([
            'name' => 'required|min:1|max:255',
            'link' => 'required|url',
        ], [
            'name.required' => 'Le nom de l\'outil est obligatoire',
            'name.min' => 'Le nom de l\'outil doit contenir au moins 1 caractères',
            'name.max' => 'Le nom de l\'outil ne peux pas contenir plus de 255 caractères',
            'link.required' => 'Le lien de l\'outil est obligatoire',
            'link.url' => 'Le lien de l\'outil n\'est pas valide',
        ]);

        /* Message de confirmation */
        $exist = Tools::where('link', $request->input('link'))->where('user_id', Auth::id())->first();
        if ($exist != null) {
            $message = 'Attention, un outil avec le même lien existe déjà sous le nom ' . $exist->name . '. 🤔';
        } else {
            $message = '';
        }

        /* Enregistrement de l'outil */
        $tool = new Tools();
        $tool->user_id = Auth::id();
        $tool->name = $request->input('name');
        $tool->link = $request->input('link');
        $tool->position = Tools::where('user_id', Auth::id())->max('position') + 1;

        if ($tool->save()) {
            LogController::addLog('Ajout de l\'outil ' . $tool->name . ' (' . $tool->link . ')');
            return back()->with('success', 'L\'outil a été ajouté avec succès 👍')->with('message', $message);
        } else {
            LogController::addLog('Une erreur est survenue lors de l\'ajout de l\'outil ' . $tool->name . ' (' . $tool->link . ')', null, 1);
            return back()->with('error', 'Une erreur est survenue lors de l\'ajout de l\'outil');
        }
    }

    /**
     * Modifier un outil
     */
    public function editTool(Request $request)
    {
        /* Validation des informations du formulaire */
        $request->validate([
            'id' => 'required|integer',
            'name' => 'required|min:1|max:255',
            'link' => 'required|url',
        ], [
            'id.required' => 'L\'identifiant de l\'outil est obligatoire',
            'id.integer' => 'L\'identifiant de l\'outil n\'est pas valide',
            'name.required' => 'Le nom de l\'outil est obligatoire',
            'name.min' => 'Le nom de l\'outil doit contenir au moins 1 caractères',
            'name.max' => 'Le nom de l\'outil ne peux pas contenir plus de 255 caractères',
            'link.required' => 'Le lien de l\'outil est obligatoire',
            'link.url' => 'Le lien de l\'outil n\'est pas valide',
        ]);

        /* Modification de l'outil */
        $tool = Tools::find($request->input('id'));
        if ($tool == null) { return back()->with('error', 'L\'outil n\'existe pas'); }
        if ($tool->user_id != Auth::id()) { return back()->with('error', 'Vous n\'avez pas les droits pour modifier cet outil'); }

        $tool->name = $request->input('name');
        $tool->link = $request->input('link');

        if ($tool->save()) {
            LogController::addLog('Modification de l\'outil ' . $tool->name . ' (' . $tool->link . ')');
            return back()->with('success', 'L\'outil a été modifié avec succès 👍');
        } else {
            LogController::addLog('Une erreur est survenue lors de la modification de l\'outil ' . $tool->name . ' (' . $tool->link . ')', null, 1);
            return back()->with('error', 'Une erreur est survenue lors de la modification de l\'outil');
        }
    }

    /*
     * Déplacer un outil
     */
    public function moveTool($id, $new_position)
    {
        /* Validation des données */
        /* id */
        if ($id == null) { back()->with('error', 'l\'id est null.'); }
        if (!is_numeric($id)) { back()->with('error', 'l\'id n\'est pas un nombre.'); }
        if ($id <= 0) { back()->with('error', 'l\'id est inférieur ou égal à 0.'); }
        /* new_position */
        if ($new_position == null) { back()->with('error', 'La nouvelle position est null.'); }
        if (!is_numeric($new_position)) { back()->with('error', 'La nouvelle position n\'est pas un nombre.'); }
        if ($new_position <= 0) { back()->with('error', 'La nouvelle position est inférieure ou égale à 0.'); }

        $tool = Tools::find($id);
        if ($tool == null) { return back()->with('error', 'L\'outil n\'existe pas'); }
        if ($tool->user_id != Auth::id()) { return back()->with('error', 'Vous n\'avez pas les droits pour déplacer cet outil'); }

        /* Décalage des positions des outils */
        $oldPosition = $tool->position;
        if ($oldPosition != $new_position) {
            $t = Tools::where('user_id', Auth::id())->where('position', $new_position)->first();
            if ($t != null) {
                $t->position = $oldPosition;
                if (! $t->save()) { return back()->with('error', 'Une erreur est survenue lors du décalage des positions des outils'); }
            }
        }

        $tool->position = $new_position;
        if ($tool->save()) {
            LogController::addLog('Déplacement de l\'outil ' . $tool->name . ' (' . $tool->link . ')');
            return back()->with('success', 'L\'outil a été déplacé avec succès 👍')->with('modif', 'true')->with('position', min(array($oldPosition, $new_position)) - 2);
        } else {
            LogController::addLog('Une erreur est survenue lors du déplacement de l\'outil ' . $tool->name . ' (' . $tool->link . ')', null, 1);
            return back()->with('error', 'Une erreur est survenue lors du déplacement de l\'outil');
        }
    }

    /**
     * Supprimer un outil
     */
    public function deleteTool($id)
    {
        /* Validation des données */
        if ($id == null) { back()->with('error', 'l\'id est null.'); }
        if (!is_numeric($id)) { back()->with('error', 'l\'id n\'est pas un nombre.'); }
        if ($id <= 0) { back()->with('error', 'l\'id est inférieur ou égal à 0.'); }

        $tool = Tools::find($id);
        if ($tool == null) { return back()->with('error', 'L\'outil n\'existe pas'); }
        if ($tool->user_id != Auth::id()) { return back()->with('error', 'Vous n\'avez pas les droits pour supprimer cet outil'); }
        
        /* Décalage des positions des outils */
        $tools = Tools::where('user_id', Auth::id())->where('position', '>', $tool->position)->get();
        foreach ($tools as $t) {
            $t->position = $t->position - 1;
            if ($t->save()) { return back()->with('error', 'Une erreur est survenue lors du décalage des positions des outils'); }
        }

        /* Suppression de l'outil */
        if ($tool->delete()) {
            LogController::addLog('Suppression de l\'outil ' . $tool->name . ' (' . $tool->link . ')');
            return back()->with('success', 'L\'outil a été supprimé avec succès 👍');
        } else {
            LogController::addLog('Une erreur est survenue lors de la suppression de l\'outil ' . $tool->name . ' (' . $tool->link . ')', null, 1);
            return back()->with('error', 'Une erreur est survenue lors de la suppression de l\'outil');
        }
    }
}