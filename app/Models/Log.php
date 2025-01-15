<?php
namespace App\Models;

/*
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Log extends Model
{
    use HasFactory;

    protected $connection = 'mysql';
    protected $table = 'logs';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'app',
        'host',
        'user_id',
        'ip',
        'link_from',
        'link_to',
        'method_to',
        'user_agent',
        'message',
        'status',
    ];

    /**
     * Permet de convertir le modèle en tableau
     * @return array<string, string> Tableau contenant les attributs du modèle
     */
    public function toArray()
    {
        return [
            'id' => $this->id,
            'app' => $this->app,
            'host' => $this->host,
            'user_id' => $this->user_id,
            'ip' => $this->ip,
            'link_from' => $this->link_from,
            'link_to' => $this->link_to,
            'method_to' => $this->method_to,
            'user_agent' => $this->user_agent,
            'message' => $this->message,
            'status' => $this->status,
            'created_at' => date_format($this->created_at, 'd/m/Y H:i:s')
        ];
    }
}
