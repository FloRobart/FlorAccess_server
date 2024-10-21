<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('adresse_ips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('adresse_ip');
            $table->boolean('est_bannie')->default(false);
            $table->timestamps();
        });

        Schema::create('adresse_ips_tokens', function (Blueprint $table) {
            $table->string('email');
            $table->string('adresse_ip');
            $table->string('token');
            $table->timestamp('created_at')->nullable();

            $table->primary(['email', 'adresse_ip']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('adresse_ips');
        Schema::dropIfExists('adresse_ips_tokens');
    }
};
