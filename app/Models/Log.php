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
}
